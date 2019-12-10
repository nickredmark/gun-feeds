import { Feed } from "./Feed";
import React, { useState, useEffect } from "react";
import { getPub, useGun, getSet, getId } from "nicks-gun-utils";

const Gun = require("gun/gun");
require("gun/sea");
require("gun/lib/radix");
require("gun/lib/radisk");
require("gun/lib/store");
require("gun/lib/rindexed");

export const GunFeed = ({ id, priv, epriv, oepriv }) => {
  const [gun, setGun] = useState(null);
  const pub = getPub(id);
  const pair = pub && priv && { pub, priv, epriv, oepriv };
  const [data, onData, put] = useGun(Gun, gun, useState, pair);

  useEffect(() => {
    const gun = Gun({
      localStorage: false,
      peers: ["https://gunjs.herokuapp.com/gun", "http://nmr.io:8765/gun"]
    });
    gun.get(id).on(onData);
    gun
      .get(`${id}.subs`)
      .on(onData)
      .map()
      .on(onData)
      .get("sub")
      .on(onData)
      .get("lastMessage")
      .on(onData);
    setGun(gun);
  }, []);

  if (!gun) {
    return <div>Loading...</div>;
  }

  const feed = {
    ...data[id],
    subs: getSet(data, `${id}.subs`).map(sub => {
      return {
        ...sub,
        sub: sub.sub &&
          data[sub.sub["#"]] && {
            ...data[sub.sub["#"]],
            lastMessage:
              data[sub.sub["#"]].lastMessage &&
              data[data[sub.sub["#"]].lastMessage["#"]]
          }
      };
    })
  };

  return (
    <Feed
      getId={getId}
      priv={priv}
      epriv={epriv}
      feed={feed}
      id={id}
      onSetFeedName={name => put([id, "name", name])}
      onAddSub={url => {
        let parsed;
        try {
          parsed = new URL(url);
        } catch (e) {
          // TODO: create new stream
          return;
        }
        try {
          const subId = parsed.searchParams.get("id");
          if (!subId) {
            throw new Error("Could not detect id in url");
          }
          const hashUrlParams = new URLSearchParams(parsed.hash.substr(1));
          const subPriv = hashUrlParams.get("priv");
          const subEpriv = hashUrlParams.get("epriv");
          const legacy = hashUrlParams.get("legacy");
          const subLinkId = `${id}.subs.${subId}`;
          const puts = [
            [`${id}.subs`, subId, { "#": subLinkId }],
            [subLinkId, "sub", { "#": subId }]
          ];
          if (legacy) {
            puts.push([subLinkId, "legacy", true]);
          }
          if (subPriv) {
            puts.push([subLinkId, "priv", subPriv]);
          }
          if (subEpriv) {
            puts.push([subLinkId, "epriv", subEpriv]);
          }
          put(...puts);
        } catch (e) {
          alert(e.message);
          throw e;
        }
      }}
    />
  );
};
