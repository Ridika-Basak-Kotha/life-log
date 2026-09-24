import React from "react";
import { View, Text, StyleSheet } from "react-native";

const WeatherScreen: React.FC = () => {
  // later: call a real weather API using fetch/axios
  const fakeWeather = {
    city: "Dhaka",
    temp: 30,
    condition: "Sunny",
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Weather</Text>
      <View style={styles.card}>
        <Text style={styles.city}>{fakeWeather.city}</Text>
        <Text style={styles.temp}>{fakeWeather.temp}°C</Text>
        <Text style={styles.condition}>{fakeWeather.condition}</Text>
      </View>
    </View>
  );
};

export default WeatherScreen;

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
  card: {
    backgroundColor: "#fff",
    paddingVertical: 40,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
  },
  city: {
    fontSize: 20,
    fontWeight: "600",
  },
  temp: {
    fontSize: 40,
    fontWeight: "700",
    marginVertical: 8,
  },
  condition: {
    fontSize: 18,
  },
});
