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
  const [fees, setFees] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const paid = parseFloat(paidAmount);
    const received = parseFloat(receivedAmount);
    const fee = parseFloat(fees) || 0;
    if (!isFinite(paid) || !isFinite(received)) return;
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
    setFees("");
    setReceivedAmount("");
  }

  return (
    <form className="dp-form" onSubmit={submit}>
      <div className="row">
        <label>
          Paid ({symbol(session.paidCurrency)})
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={paidAmount}
            onChange={(e) => setPaidAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </label>
        <label>
          Fees ({symbol(session.paidCurrency)})
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={fees}
            onChange={(e) => setFees(e.target.value)}
            placeholder="0.00"
          />
        </label>
        <label>
          Received ({symbol(session.receivedCurrency)})
          <input
            type="number"
            inputMode="decimal"
            step="any"
            min="0"
            value={receivedAmount}
            onChange={(e) => setReceivedAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </label>
        <button type="submit">Add</button>
      </div>
    </form>
  );
}
