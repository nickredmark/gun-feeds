import moment from "moment";
import React, { useEffect, useState, useRef } from "react";

import { getPub, qs, getMd, getId } from "nicks-gun-utils";

export const Feed = ({
  id,
  priv,
  epriv,
  feed,
  onSetFeedName,
  onAddSub,
  onDeleteSub
}) => {
  const pub = getPub(id);
  const editable = !pub || !!priv;
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [md, setMd] = useState();
  const isWritable = !pub || !!priv;

  useEffect(() => {
    if (feed.name) {
      window.document.title = feed.name;
    }
  }, [feed.name]);

  const hash = qs({ priv, epriv }, "#");
  useEffect(() => {
    setMd(getMd({ pub, hash }));
  }, [id]);

  if (!md) {
    return <div>Loading...</div>;
  }

  return (
    <div className="feed">
      <header>
        {editing ? (
          <form
            onSubmit={e => {
              e.preventDefault();
              onSetFeedName(newName);
              setEditing(false);
            }}
          >
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="feed name"
            />
          </form>
        ) : (
          <h1
            className={editable ? "editable" : ""}
            onDoubleClick={
              editable &&
              (() => {
                setNewName(document.name);
                setEditing(true);
              })
            }
          >
            {feed.name || "unnamed"}
            <a
              className="feed-permalink"
              href={`?id=${id}${qs({ epriv }, "#")}`}
              target="_blank"
              onClick={e => {
                e.preventDefault();
                navigator.clipboard.writeText(
                  `${location.origin}?id=${id}${qs({ epriv }, "#")}`
                );
                alert("Readonly URL copied to clipboard!");
              }}
            >
              #
            </a>
          </h1>
        )}
      </header>
      <main>
        <ul>
          {feed.subs
            .filter(sub => sub.sub)
            .sort(subComparator)
            .map(({ sub, epriv, priv, legacy }) => {
              const id = getId(sub);
              return (
                <li key={id} className="sub-item-li">
                  <a
                    href={`https://gun-streams.nmaro.now.sh${qs(
                      { id, legacy },
                      "?"
                    )}${qs({ epriv, priv })}`}
                    target="_blank"
                    className="sub-item"
                  >
                    <span className="sub-item-name">{sub.name}</span>
                    <span className="sub-item-date">
                      {formatTime(getSubTimestamp(sub))}
                    </span>
                    <span className="sub-item-last-message">
                      {sub.lastMessage && sub.lastMessage.text && (
                        <ShortMessageContent message={sub.lastMessage} />
                      )}
                    </span>
                  </a>
                  {isWritable && (
                    <a
                      href="#"
                      className="sub-item-remove"
                      onClick={() => onDeleteSub({ space, streamId: id })}
                    >
                      X
                    </a>
                  )}
                </li>
              );
            })}
        </ul>
      </main>
      {isWritable && <AddSub onAddSub={onAddSub} />}
    </div>
  );
};

export const AddSub = ({ onAddSub }) => {
  const url = useRef(null);
  return (
    <form
      onSubmit={async e => {
        e.preventDefault();
        onAddSub(url.current.value);
        url.current.value = "";
      }}
    >
      <input ref={url} placeholder="new feed url" className="new-sub" />
    </form>
  );
};

const formatTime = timestamp => {
  if (moment().subtract(2, "day") < moment(timestamp)) {
    return moment(timestamp).fromNow();
  }

  if (moment().subtract(7, "day") < moment(timestamp)) {
    return moment(timestamp).format("dddd");
  }

  return moment(timestamp).format("YYYY/MM/DD");
};

const getSubTimestamp = sub => {
  if (sub.lastMessage && sub.lastMessage.created) {
    return sub.lastMessage.created;
  }

  return sub.created;
};

const subComparator = (a, b) => getSubTimestamp(b) - getSubTimestamp(a);
