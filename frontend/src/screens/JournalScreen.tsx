import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";

type JournalEntry = {
  id: string;
  text: string;
};

const JournalScreen: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [text, setText] = useState("");

const addEntry = () => {
  if (!text.trim()) return;
  setEntries((prev) => [
    { id: Math.random().toString(), text: text.trim() },
    ...prev,
  ]);
  setText("");
};


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Journal</Text>

      <TextInput
        style={styles.textArea}
        placeholder="Write about your day..."
        multiline
        value={text}
        onChangeText={setText}
      />

      <TouchableOpacity style={styles.saveBtn} onPress={addEntry}>
        <Text style={styles.saveText}>Save Entry</Text>
      </TouchableOpacity>

      <FlatList
        style={{ marginTop: 16 }}
        data={entries}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <View style={styles.entryCard}>
            <Text>{item.text}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default JournalScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9fafb",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: "#fff",
    minHeight: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    textAlignVertical: "top",
  },
  saveBtn: {
    marginTop: 10,
    backgroundColor: "#10b981",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "600",
  },
  entryCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
});
