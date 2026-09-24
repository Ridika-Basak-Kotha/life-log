// backend/src/routes/routine.routes.ts
import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";
import { Routine } from "../models/routine.model";

const router = Router();

// helper: get date from query or today
function getDateFromQuery(req: AuthRequest): string {
  const q = (req.query.date as string) || "";
  if (q) return q;

  const d = new Date();
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// GET /api/routines?date=YYYY-MM-DD
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const date = getDateFromQuery(req);

    const routines = await Routine.find({
      user: req.userId,
      date,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ routines });
  } catch (err) {
    console.error("GET /api/routines error", err);
    return res.status(500).json({ message: "Failed to fetch routines" });
  }
});

// POST /api/routines
router.post("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { title, notes, date, startTime, endTime } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const d = date || getDateFromQuery(req);

    const routine = await Routine.create({
      user: req.userId,
      title,
      notes,
      date: d,
      startTime,
      endTime,
      status: "pending",
      isCompleted: false,
    });

    return res.status(201).json({ routine });
  } catch (err) {
    console.error("POST /api/routines error", err);
    return res.status(500).json({ message: "Failed to create routine" });
  }
});

// PUT /api/routines/:id
router.put("/:id", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { title, notes, date, startTime, endTime, status, isCompleted } =
      req.body;

    const update: any = {};
    if (title !== undefined) update.title = title;
    if (notes !== undefined) update.notes = notes;
    if (date !== undefined) update.date = date;
    if (startTime !== undefined) update.startTime = startTime;
    if (endTime !== undefined) update.endTime = endTime;
    if (status !== undefined) update.status = status;
    if (isCompleted !== undefined) update.isCompleted = isCompleted;

    // keep flags in sync
    if (status === "completed") update.isCompleted = true;
    if (status === "pending") update.isCompleted = false;
    if (isCompleted === true && !status) update.status = "completed";
    if (isCompleted === false && !status) update.status = "pending";

    const routine = await Routine.findOneAndUpdate(
      { _id: id, user: req.userId },
      { $set: update },
      { new: true }
    );

    if (!routine) {
      return res.status(404).json({ message: "Routine not found" });
    }

    return res.status(200).json({ routine });
  } catch (err) {
    console.error("PUT /api/routines/:id error", err);
    return res.status(500).json({ message: "Failed to update routine" });
  }
});

// DELETE /api/routines/:id
router.delete(
  "/:id",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;

      const routine = await Routine.findOneAndDelete({
        _id: id,
        user: req.userId,
      });

      if (!routine) {
        return res.status(404).json({ message: "Routine not found" });
      }

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("DELETE /api/routines/:id error", err);
      return res.status(500).json({ message: "Failed to delete routine" });
    }
  }
);

// POST /api/routines/:id/toggle
router.post(
  "/:id/toggle",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { id } = req.params;

      const routine = await Routine.findOne({ _id: id, user: req.userId });
      if (!routine) {
        return res.status(404).json({ message: "Routine not found" });
      }

      const newCompleted = !routine.isCompleted;
      routine.isCompleted = newCompleted;
      routine.status = newCompleted ? "completed" : "pending";

      await routine.save();

      return res.status(200).json({ routine });
    } catch (err) {
      console.error("POST /api/routines/:id/toggle error", err);
      return res.status(500).json({ message: "Failed to toggle routine" });
    }
  }
);

// GET /api/routines/stats/day?date=YYYY-MM-DD
router.get(
  "/stats/day",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const date = getDateFromQuery(req);

      const total = await Routine.countDocuments({
        user: req.userId,
        date,
      });

      const completed = await Routine.countDocuments({
        user: req.userId,
        date,
        isCompleted: true,
      });

      const completionRate = total > 0 ? completed / total : 0;

      return res.status(200).json({
        stats: {
          date,
          total,
          completed,
          completionRate,
        },
      });
    } catch (err) {
      console.error("GET /api/routines/stats/day error", err);
      return res.status(500).json({ message: "Failed to fetch stats" });
    }
  }
);

export default router;
