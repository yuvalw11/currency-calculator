import { useState } from "react";
import type { DataPoint, Session } from "./types";
import { symbol } from "./types";
import { newId } from "./storage";

interface Props {
  session: Session;
  onAdd: (dp: DataPoint) => void;
}

export function DataPointForm({ session, onAdd }: Props) {
  const [paidAmount, setPaidAmount] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [fees, setFees] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const paid = parseFloat(paidAmount);
    const received = parseFloat(receivedAmount);
    const fee = parseFloat(fees);
    if (!isFinite(paid) || !isFinite(received) || !isFinite(fee)) return;
    if (paid <= 0 || received <= 0 || fee < 0) return;
    if (fee >= paid) return;

    onAdd({
      id: newId(),
      paidAmount: paid,
      receivedAmount: received,
      fees: fee,
      createdAt: new Date().toISOString(),
    });

    setPaidAmount("");
    setReceivedAmount("");
    setFees("");
  }

  return (
    <form className="dp-form" onSubmit={submit}>
      <div className="row">
        <label>
          Paid amount ({symbol(session.paidCurrency)})
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            placeholder="100.00"
            required
          />
        </label>
        <label>
          Received amount ({symbol(session.receivedCurrency)})
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={receivedAmount}
            onChange={(e) => setReceivedAmount(e.target.value)}
            placeholder="90.00"
            required
          />
        </label>
        <label>
          Fees ({symbol(session.paidCurrency)}, included in paid)
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={fees}
            onChange={(e) => setFees(e.target.value)}
            placeholder="2.00"
            required
          />
        </label>
      </div>

      <button type="submit">Add data point</button>
    </form>
  );
}
