import React from 'react';
import UserNavbar from '../../../layouts/UserNavbar';

function UserPage() {
  return (
    <div style={{ backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <UserNavbar username="Usuario" />
      <div style={{ paddingTop: '100px', padding: '100px 40px 40px 40px', textAlign: 'center' }}>
      </div>
    </div>
  );
}

export default UserPage;