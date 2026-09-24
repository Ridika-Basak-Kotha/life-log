import { Schema, model, Document, Types } from "mongoose";

export type RoutineStatus = "pending" | "completed";

export interface IRoutine extends Document {
  user: Types.ObjectId;
  title: string;
  notes?: string;
  date: string;        // yyyy-mm-dd
  startTime?: string;  // "07:30"
  endTime?: string;    // "08:00"
  status: RoutineStatus;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoutineSchema = new Schema<IRoutine>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    notes: { type: String },
    date: { type: String, required: true }, // store as simple date string, easier queries
    startTime: { type: String },
    endTime: { type: String },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Routine = model<IRoutine>("Routine", RoutineSchema);
