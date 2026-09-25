import React, { useState } from 'react';
import { OrgChart } from 'corinovate-react-org-chart/react';
import type { OrgChartData } from 'corinovate-react-org-chart';

const PURPLE = '#7c5cff'; // Engineering
const TEAL = '#0d9488'; // Finance
const ORANGE = '#f97316'; // Sales

const initialData: OrgChartData = {
  people: [
    { id: 'alice', name: 'Alice Kim', title: 'CEO', department: 'Leadership', icon: '👥', color: PURPLE, status: 'Active', photoUrl: 'https://i.pravatar.cc/150?img=47', customFields: { email: 'alice@company.com', employeeId: 'EMP-00001' } },

    { id: 'bob', name: 'Bob Diaz', title: 'CTO', department: 'Technology', icon: '💻', managerId: 'alice', color: PURPLE, status: 'Active', photoUrl: 'https://i.pravatar.cc/150?img=12', customFields: { email: 'bob@company.com', employeeId: 'EMP-00012' } },
    { id: 'carla', name: 'Carla Ng', title: 'CFO', department: 'Finance', icon: '📊', managerId: 'alice', color: TEAL, status: 'Active', customFields: { email: 'carla@company.com', employeeId: 'EMP-00013' } },
    { id: 'derek', name: 'Derek Osei', title: 'VP Sales', department: 'Sales', icon: '📈', managerId: 'alice', color: ORANGE, status: 'Active', customFields: { email: 'derek@company.com', employeeId: 'EMP-00014' } },

    { id: 'ellen', name: 'Ellen Vance', title: 'Eng Manager', department: 'Engineering', icon: '💻', managerId: 'bob', color: PURPLE, status: 'Active', customFields: { email: 'ellen@company.com', employeeId: 'EMP-00041' } },
    { id: 'farid', name: 'Farid Haidari', title: 'Eng Manager', department: 'Engineering', icon: '💻', managerId: 'bob', color: PURPLE, status: 'On leave', statusColor: '#b45309', customFields: { email: 'farid@company.com', employeeId: 'EMP-00042' } },

    { id: 'grace', name: 'Grace Lin', title: 'Senior Engineer', department: 'Engineering', icon: '💻', managerId: 'ellen', color: PURPLE, status: 'Active', customFields: { email: 'grace@company.com', employeeId: 'EMP-00071' } },
    { id: 'hassan', name: 'Hassan Ali', title: 'Engineer', department: 'Engineering', icon: '💻', managerId: 'ellen', color: PURPLE, status: 'Active', customFields: { email: 'hassan@company.com', employeeId: 'EMP-00072' } },

    { id: 'ivy', name: 'Ivy Torres', title: 'Senior Engineer', department: 'Engineering', icon: '💻', managerId: 'farid', color: PURPLE, status: 'Active', customFields: { email: 'ivy@company.com', employeeId: 'EMP-00073' } },

    { id: 'jack', name: 'Jack Nolan', title: 'Controller', department: 'Finance', icon: '📊', managerId: 'carla', color: TEAL, status: 'Active', customFields: { email: 'jack@company.com', employeeId: 'EMP-00078' } },

    { id: 'kara', name: 'Kara Singh', title: 'Account Executive', department: 'Sales', icon: '📈', managerId: 'derek', color: ORANGE, status: 'Active', customFields: { email: 'kara@company.com', employeeId: 'EMP-00091' } },
    { id: 'leo', name: 'Leo Fischer', title: 'Account Executive', department: 'Sales', icon: '📈', managerId: 'derek', color: ORANGE, status: 'Active', customFields: { email: 'leo@company.com', employeeId: 'EMP-00092' } },
  ],
};

export function App() {
  const [data, setData] = useState<OrgChartData>(initialData);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <OrgChart
        data={data}
        onChange={setData}
        editable
        printable
        drawerFields={[
          { key: 'title', label: 'Title', icon: '👤' },
          { key: 'department', label: 'Department', icon: '🏢' },
          { key: 'email', label: 'Email', icon: '✉️' },
          { key: 'employeeId', label: 'Employee ID', icon: '🪪' },
        ]}
        onNodeClick={(p) => console.log('clicked', p.name)}
      />
    </div>
  );
}
