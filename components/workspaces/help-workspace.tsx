"use client";

import { useEffect, useId, useState } from "react";
import { DeskLocalized } from "../desk-language";
import { logDeskFailure } from "../../lib/desk-api";
import {
  GradientPanel,
  Send,
  StateIcon,
} from "./shared-ui";

export type HelpDashboard = {
  community_url: string;
  recovery_cases?: Array<{ id: string | number; asset: string; network: string; status: string }>;
};

export function HelpWorkspace({
  data,
  request,
  onNotice,
}: {
  data: HelpDashboard;
  request: (path: string, options?: RequestInit) => Promise<any>;
  onNotice: (message: string) => void;
}) {
  const [network, setNetwork] = useState("");
  const [asset, setAsset] = useState("");
  const [hash, setHash] = useState("");
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");
  const [recoveryPending, setRecoveryPending] = useState(false);
  const [recoveryCases, setRecoveryCases] = useState(data.recovery_cases || []);
  const fieldId = useId();
  useEffect(() => {
    setRecoveryCases(data.recovery_cases || []);
  }, [data.recovery_cases]);
  return (
    <DeskLocalized>
    <div className="account-screen">
      <div className="screen-title">
        <div>
          <span className="eyebrow">HELP / SUPPORT</span>
          <h2>Help center</h2>
        </div>
        <button
          className="share-action"
          onClick={() =>
            window.open(data.community_url, "_blank", "noopener,noreferrer")
          }
        >
          Community <StateIcon name="arrow-up-right" />
        </button>
      </div>
      <GradientPanel className="levels-card">
        <span className="eyebrow">COMMON QUESTIONS</span>
        <h2>Deposits, withdrawals, and account access</h2>
        {[
          [
            "Below-minimum deposit",
            "Send the remainder to the same active address.",
          ],
          [
            "Deposit not showing",
            "Choose I sent the deposit after sending; credit follows on-chain confirmation.",
          ],
          [
            "Withdrawal pending",
            "Funds remain locked until released or rejected.",
          ],
          ["Wrong network", "Do not send more. Submit the transaction below."],
        ].map(([title, body]) => (
          <div className="level-row" key={title}>
            <b>?</b>
            <span>
              <strong>{title}</strong>
              <small>{body}</small>
            </span>
          </div>
        ))}
      </GradientPanel>
      <GradientPanel className="flow-card">
        <img
          src="/illustrations/recovery-lifebuoy.png"
          alt="Recovery support"
          className="recovery-art"
        />
        <span className="eyebrow">WRONG-NETWORK RECOVERY</span>
        <h2>Submit for manual review</h2>
        <div className="alert-fields">
          <div>
            <label className="amount-field" htmlFor={`${fieldId}-network`}>Network</label>
            <input
              id={`${fieldId}-network`}
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              aria-label="Recovery network"
              placeholder="Network"
            />
          </div>
          <div>
            <label className="amount-field" htmlFor={`${fieldId}-asset`}>Asset</label>
            <input
              id={`${fieldId}-asset`}
              value={asset}
              onChange={(e) => setAsset(e.target.value)}
              aria-label="Recovery asset"
              placeholder="Asset"
            />
          </div>
        </div>
        <label className="amount-field" htmlFor={`${fieldId}-hash`}>Transaction hash</label>
        <input
          id={`${fieldId}-hash`}
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          aria-label="Recovery transaction hash"
          placeholder="Transaction hash"
        />
        <label className="amount-field" htmlFor={`${fieldId}-address`}>Address sent to</label>
        <input
          id={`${fieldId}-address`}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          aria-label="Address the transfer was sent to"
          placeholder="Address sent to"
        />
        <label className="amount-field" htmlFor={`${fieldId}-details`}>Recovery details, including asset and amount</label>
        <textarea
          id={`${fieldId}-details`}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          aria-label="Recovery details, including asset and amount"
          placeholder="What happened? Include the asset, amount, and any relevant details."
          rows={3}
        />
        <button
          className="primary-action"
          disabled={recoveryPending || !network.trim() || !asset.trim() || !hash.trim() || !address.trim() || details.trim().length < 10}
          onClick={async () => {
            if (recoveryPending) return;
            setRecoveryPending(true);
            try {
              const result = await request("/v1/recovery", {
                method: "POST",
                body: JSON.stringify({
                  network,
                  asset,
                  tx_hash: hash,
                  destination: address,
                  details,
                }),
              });
              setNetwork("");
              setAsset("");
              setHash("");
              setAddress("");
              setDetails("");
              if (result.recovery_case) {
                setRecoveryCases((current) => [
                  result.recovery_case,
                  ...current.filter((recovery) => recovery.id !== result.recovery_case.id),
                ]);
              }
              onNotice("Recovery case submitted for review.");
            } catch (error) {
              logDeskFailure("support.recovery-create", error);
              void request("/v1/dashboard")
                .then((latest) => {
                  if (Array.isArray(latest?.recovery_cases)) setRecoveryCases(latest.recovery_cases);
                })
                .catch((refreshError) => logDeskFailure("support.recovery-reconcile", refreshError));
            } finally {
              setRecoveryPending(false);
            }
          }}
        >
          {recoveryPending ? "Submitting…" : "Submit recovery case"} <Send />
        </button>
      </GradientPanel>
      <GradientPanel className="flow-card">
        <span className="eyebrow">RECOVERY STATUS</span>
        <h2>Your submitted cases</h2>
        {recoveryCases.length ? (
          <div className="support-ticket-list">
            {recoveryCases.slice(0, 10).map((recovery) => (
              <div className="activity-row" key={recovery.id}>
                <div className="activity-info">
                  <strong>RC-{recovery.id} · {recovery.asset} / {recovery.network}</strong>
                  <small>{recovery.status.replace("_", " ")} · no automatic credit or transfer</small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No recovery cases submitted.</p>
        )}
      </GradientPanel>
      <GradientPanel className="flow-card">
        <span className="eyebrow">SUPPORT</span>
        <h2>Need help with something else?</h2>
        <p>Need a hand with your account, bots, deposits, or anything else? Message us directly on Telegram.</p>
        <a
          className="primary-action support-contact-link"
          href="https://t.me/thetessaractadmin"
          target="_blank"
          rel="noopener noreferrer"
        >
          Message @thetessaractadmin on Telegram <StateIcon name="arrow-up-right" />
        </a>
        <small className="support-contact-safety">Never share passwords, login codes, recovery phrases, or private keys.</small>
      </GradientPanel>
    </div>
    </DeskLocalized>
  );
}
