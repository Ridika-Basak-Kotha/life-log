// src/screens/RoutineScreen.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
} from "react-native";
import * as Notifications from "expo-notifications";

import { useAuth } from "../context/AuthContext";
import {
  Routine,
  RoutineStats,
  fetchRoutinesForDate,
  createRoutine,
  updateRoutine,
  deleteRoutine,
  toggleRoutine,
  fetchDailyRoutineStats,
} from "../api/routinesApi";

// ---- Notifications basic config (simple student version) ----
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    } as any),
});


function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getNiceLabelForPercent(pct: number): string {
  if (pct === 100) return "Perfect day 🎉";
  if (pct >= 80) return "Very productive 💪";
  if (pct >= 50) return "On track 👍";
  if (pct > 0) return "You did something, keep going 🙂";
  return "Let's start with one task 🚀";
}

// create a Date for the reminder time (startTime minus minutesBefore)
function buildReminderDate(
  dateStr: string,
  timeStr?: string,
  minutesBefore: number = 15
): Date | null {
  if (!timeStr) return null;
  // very naive parsing: "HH:MM"
  const [hStr, mStr] = timeStr.split(":");
  const h = parseInt(hStr || "0", 10);
  const m = parseInt(mStr || "0", 10);

  const dt = new Date(dateStr + "T00:00:00");
  dt.setHours(h);
  dt.setMinutes(m);
  dt.setSeconds(0);
  dt.setMilliseconds(0);

  if (minutesBefore > 0) {
    dt.setMinutes(dt.getMinutes() - minutesBefore);
  }

  return dt;
}

async function scheduleRoutineNotification(
  routine: Routine,
  minutesBefore: number
) {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;
    if (status !== "granted") {
      const ask = await Notifications.requestPermissionsAsync();
      finalStatus = ask.status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permission not granted");
      return;
    }

    const reminderDate = buildReminderDate(
      routine.date,
      routine.startTime,
      minutesBefore
    );
    if (!reminderDate) {
      console.log("No valid time for reminder, skipping notification");
      return;
    }

    if (reminderDate.getTime() <= Date.now()) {
      // Notification time already passed, skip
      console.log("Reminder time already passed, not scheduling");
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "LifeLog Routine Reminder",
        body: routine.title || "Upcoming routine task",
        data: { routineId: routine._id },
      },
        trigger: reminderDate as any,
    });
  } catch (err) {
    console.log("Error scheduling notification", err);
  }
}

const RoutineScreen: React.FC = () => {
  const { token } = useAuth();

  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [stats, setStats] = useState<RoutineStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // form modal state
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editing, setEditing] = useState<Routine | null>(null);

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [startTime, setStartTime] = useState(""); // "HH:MM"
  const [endTime, setEndTime] = useState(""); // "HH:MM"
  const [reminderMinutes, setReminderMinutes] = useState("15");

  const [submitting, setSubmitting] = useState(false);

  const todayStr = formatDate(new Date());

  // Load routines + stats whenever date or token changes
  useEffect(() => {
    if (!token) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, selectedDate]);

  const loadData = async () => {
    if (!token) return;
    try {
      setLoading(true);
      // 1) routines
      const data = await fetchRoutinesForDate(selectedDate, token);
      setRoutines(data.routines || []);

      // 2) stats – if this fails, we compute locally
      try {
        const statRes = await fetchDailyRoutineStats(selectedDate, token);
        if (statRes && statRes.stats) {
          setStats(statRes.stats);
        } else {
          computeLocalStats(data.routines || []);
        }
      } catch (err) {
        console.log("stats error", err);
        computeLocalStats(data.routines || []);
      }
    } catch (err: any) {
      console.log("loadData error", err?.message || err);
      Alert.alert(
        "Error",
        err?.message || "Failed to load routines. Check server connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const computeLocalStats = (list: Routine[]) => {
    const total = list.length;
    const completed = list.filter((r) => r.isCompleted).length;
    const completionRate = total > 0 ? completed / total : 0;
    setStats({
      date: selectedDate,
      total,
      completed,
      completionRate,
    });
  };

  const openNewModal = () => {
    setEditing(null);
    setTitle("");
    setNotes("");
    setStartTime("");
    setEndTime("");
    setReminderMinutes("15");
    setModalVisible(true);
  };

  const openEditModal = (routine: Routine) => {
    setEditing(routine);
    setTitle(routine.title || "");
    setNotes(routine.notes || "");
    setStartTime(routine.startTime || "");
    setEndTime(routine.endTime || "");
    setReminderMinutes("15");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!token) return;
    if (!title.trim()) {
      Alert.alert("Validation", "Please enter a title.");
      return;
    }

    const payload = {
      title: title.trim(),
      notes: notes.trim() || undefined,
      date: selectedDate,
      startTime: startTime.trim() || undefined,
      endTime: endTime.trim() || undefined,
    };

    try {
      setSubmitting(true);
      if (editing) {
        const res = await updateRoutine(editing._id, payload, token);
        // schedule alarm again (very naive, will not cancel older)
        const mins = parseInt(reminderMinutes || "0", 10);
        if (mins > 0) {
          await scheduleRoutineNotification(res.routine, mins);
        }
      } else {
        const res = await createRoutine(payload, token);
        const mins = parseInt(reminderMinutes || "0", 10);
        if (mins > 0) {
          await scheduleRoutineNotification(res.routine, mins);
        }
      }

      setModalVisible(false);
      setEditing(null);
      setTitle("");
      setNotes("");
      setStartTime("");
      setEndTime("");

      await loadData();
    } catch (err: any) {
      console.log("save routine error", err?.message || err);
      Alert.alert("Error", err?.message || "Failed to save routine");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (routine: Routine) => {
    if (!token) return;
    Alert.alert(
      "Delete routine",
      `Are you sure you want to delete "${routine.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRoutine(routine._id, token);
              await loadData();
            } catch (err: any) {
              console.log("delete error", err?.message || err);
              Alert.alert("Error", err?.message || "Failed to delete routine");
            }
          },
        },
      ]
    );
  };

  const handleToggleDone = async (routine: Routine) => {
    if (!token) return;
    try {
      // simple optimistic UI
      setRoutines((prev) =>
        prev.map((r) =>
          r._id === routine._id
            ? { ...r, isCompleted: !r.isCompleted, status: r.isCompleted ? "pending" : "completed" }
            : r
        )
      );
      await toggleRoutine(routine._id, token);
      await loadData();
    } catch (err: any) {
      console.log("toggle error", err?.message || err);
      Alert.alert("Error", err?.message || "Failed to update routine");
    }
  };

  const changeDateBy = (days: number) => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + days);
    setSelectedDate(formatDate(d));
  };

  const goToToday = () => {
    setSelectedDate(todayStr);
  };

  const productivityPercent = stats
    ? Math.round((stats.completionRate || 0) * 100)
    : 0;

  const renderRoutineItem = ({ item }: { item: Routine }) => {
    const isDone = item.isCompleted;
    return (
      <View style={[styles.card, isDone && styles.cardDone]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, isDone && styles.cardTitleDone]}>
            {item.title}
          </Text>
          <Text style={[styles.statusPill, isDone ? styles.statusDone : styles.statusPending]}>
            {isDone ? "Done" : "Pending"}
          </Text>
        </View>

        {item.startTime || item.endTime ? (
          <Text style={styles.timeText}>
            ⏰ {item.startTime || "??:??"} – {item.endTime || "??:??"}
          </Text>
        ) : null}

        {item.notes ? <Text style={styles.notesText}>{item.notes}</Text> : null}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.smallBtn, isDone ? styles.undoBtn : styles.doneBtn]}
            onPress={() => handleToggleDone(item)}
          >
            <Text style={styles.smallBtnText}>{isDone ? "Undo" : "Mark done"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallBtn, styles.editBtn]}
            onPress={() => openEditModal(item)}
          >
            <Text style={styles.smallBtnText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.smallBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item)}
          >
            <Text style={styles.smallBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Date selector header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.dateArrow} onPress={() => changeDateBy(-1)}>
          <Text style={styles.dateArrowText}>◀</Text>
        </TouchableOpacity>

        <View style={styles.dateCenter}>
          <Text style={styles.dateText}>{selectedDate}</Text>
          {selectedDate === todayStr && <Text style={styles.todayChip}>Today</Text>}
        </View>

        <TouchableOpacity style={styles.dateArrow} onPress={() => changeDateBy(1)}>
          <Text style={styles.dateArrowText}>▶</Text>
        </TouchableOpacity>
      </View>

      {selectedDate !== todayStr && (
        <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
          <Text style={styles.todayButtonText}>Jump to Today</Text>
        </TouchableOpacity>
      )}

      {/* Productivity stats */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Productivity</Text>
        <Text style={styles.statsSubtitle}>
          {stats
            ? `${stats.completed}/${stats.total} tasks completed`
            : "No data for this day yet"}
        </Text>

        <View style={styles.progressBarOuter}>
          <View style={[styles.progressBarInner, { width: `${productivityPercent}%` }]} />
        </View>

        <Text style={styles.statsPercent}>{productivityPercent}%</Text>
        <Text style={styles.statsLabel}>{getNiceLabelForPercent(productivityPercent)}</Text>
      </View>

      {/* Add button */}
      <View style={styles.addRow}>
        <TouchableOpacity style={styles.addButton} onPress={openNewModal}>
          <Text style={styles.addButtonText}>+ Add routine</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" />
        </View>
      ) : routines.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            No routines for this day yet. Start by adding one!
          </Text>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(item) => item._id}
          renderItem={renderRoutineItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}

      {/* Modal for add/edit */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editing ? "Edit routine" : "New routine"}
              </Text>
              <Text style={styles.modalDateText}>{selectedDate}</Text>

              <TextInput
                style={styles.input}
                placeholder="Title (e.g. Morning study)"
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Notes (optional)"
                value={notes}
                onChangeText={setNotes}
                multiline
              />

              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Start (HH:MM)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="08:00"
                    value={startTime}
                    onChangeText={setStartTime}
                  />
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>End (HH:MM)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="09:30"
                    value={endTime}
                    onChangeText={setEndTime}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Alarm (min before)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="15"
                    keyboardType="numeric"
                    value={reminderMinutes}
                    onChangeText={setReminderMinutes}
                  />
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Quick titles</Text>
                  <View style={styles.chipRow}>
                    {["Study", "Workout", "Meditation", "Sleep early"].map((txt) => (
                      <TouchableOpacity
                        key={txt}
                        style={styles.chip}
                        onPress={() => setTitle(txt)}
                      >
                        <Text style={styles.chipText}>{txt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalCancelBtn]}
                  onPress={() => {
                    if (!submitting) {
                      setModalVisible(false);
                      setEditing(null);
                    }
                  }}
                >
                  <Text style={styles.modalBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalSaveBtn]}
                  onPress={handleSave}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalBtnText}>
                      {editing ? "Save changes" : "Create"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default RoutineScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: Platform.OS === "android" ? 32 : 16,
    backgroundColor: "#f9fafb",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dateArrow: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e7eb",
  },
  dateArrowText: {
    fontSize: 18,
    fontWeight: "600",
  },
  dateCenter: {
    flex: 1,
    alignItems: "center",
  },
  dateText: {
    fontSize: 18,
    fontWeight: "700",
  },
  todayChip: {
    marginTop: 2,
    fontSize: 12,
    color: "#10b981",
    fontWeight: "600",
  },
  todayButton: {
    alignSelf: "center",
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#10b981",
  },
  todayButtonText: {
    color: "#10b981",
    fontWeight: "600",
  },
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  statsTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 13,
    marginBottom: 8,
    color: "#4b5563",
  },
  progressBarOuter: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  progressBarInner: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#10b981",
  },
  statsPercent: {
    marginTop: 6,
    fontWeight: "700",
    fontSize: 16,
  },
  statsLabel: {
    marginTop: 2,
    fontSize: 13,
    color: "#6b7280",
  },
  addRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  addButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  loaderBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    textAlign: "center",
    color: "#6b7280",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  cardDone: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: "#10b981",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardTitleDone: {
    textDecorationLine: "line-through",
    color: "#6b7280",
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    fontWeight: "600",
    overflow: "hidden",
  },
  statusDone: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusPending: {
    backgroundColor: "#fee2e2",
    color: "#b91c1c",
  },
  timeText: {
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 2,
  },
  notesText: {
    fontSize: 13,
    color: "#374151",
    marginTop: 2,
    marginBottom: 8,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 6,
  },
  smallBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  smallBtnText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  doneBtn: {
    backgroundColor: "#10b981",
  },
  undoBtn: {
    backgroundColor: "#6b7280",
  },
  editBtn: {
    backgroundColor: "#2563eb",
  },
  deleteBtn: {
    backgroundColor: "#ef4444",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "85%",
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalDateText: {
    marginTop: 2,
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  rowItem: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: "#4b5563",
    marginBottom: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    marginBottom: 4,
  },
  chipText: {
    fontSize: 11,
    color: "#374151",
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    gap: 8,
  },
  modalBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalCancelBtn: {
    backgroundColor: "#e5e7eb",
  },
  modalSaveBtn: {
    backgroundColor: "#2563eb",
  },
  modalBtnText: {
    color: "#111827",
    fontWeight: "600",
  },
});
