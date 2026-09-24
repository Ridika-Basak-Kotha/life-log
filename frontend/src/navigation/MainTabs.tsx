import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import DashboardScreen from "../screens/DashboardScreen";
import RoutineScreen from "../screens/RoutineScreen";
import JournalScreen from "../screens/JournalScreen";
import WeatherScreen from "../screens/WeatherScreen";

export type MainTabParamList = {
  Dashboard: undefined;
  Routine: undefined;
  Journal: undefined;
  Weather: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Routine" component={RoutineScreen} />
      <Tab.Screen name="Journal" component={JournalScreen} />
      <Tab.Screen name="Weather" component={WeatherScreen} />
    </Tab.Navigator>
  );
};

export default MainTabs;
