import React, { useState } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { OrgChart } from 'core-innovate-tree/native';
import type { OrgChartData } from 'core-innovate-tree';

const PURPLE = '#7c5cff';
const TEAL = '#0d9488';

const initialData: OrgChartData = {
  people: [
    { id: 'alice', name: 'Alice Kim', title: 'CEO', department: 'Leadership', icon: '👥', color: PURPLE },
    { id: 'bob', name: 'Bob Diaz', title: 'CTO', department: 'Technology', icon: '💻', managerId: 'alice', color: PURPLE },
    { id: 'carla', name: 'Carla Ng', title: 'CFO', department: 'Finance', icon: '📊', managerId: 'alice', color: TEAL },
    { id: 'ellen', name: 'Ellen Vance', title: 'Eng Manager', department: 'Platform', icon: '💻', managerId: 'bob', color: PURPLE },
    { id: 'grace', name: 'Grace Lin', title: 'Senior Engineer', department: 'Platform', icon: '💻', managerId: 'ellen', color: PURPLE },
  ],
};

export default function App() {
  const [data, setData] = useState<OrgChartData>(initialData);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <StatusBar barStyle="dark-content" />
        <OrgChart
          data={data}
          onChange={setData}
          editable
          printable
          drawerFields={[
            { key: 'title', label: 'Title' },
            { key: 'department', label: 'Department' },
          ]}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
