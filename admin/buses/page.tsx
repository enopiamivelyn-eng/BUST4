'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import styles from './page.module.css';

interface Bus {
  code: string;
  name: string;
  capacity: number;
  status: 'Active' | 'Inactive';
}

export default function AdminBusesPage() {
  const [buses, setBuses] = useState<Bus[]>([
    { code: 'Bus-001', name: 'JoyBus', capacity: 45, status: 'Active' },
    { code: 'Bus-002', name: 'PartasBus', capacity: 40, status: 'Active' },
    { code: 'Bus-003', name: 'GenBus', capacity: 35, status: 'Active' },
    { code: 'Bus-004', name: 'VBus', capacity: 40, status: 'Inactive' },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    capacity: '',
    status: 'Active'
  });
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newBus: Bus = {
      code: formData.code,
      name: formData.name,
      capacity: parseInt(formData.capacity),
      status: formData.status as 'Active' | 'Inactive'
    };
    
    setBuses([...buses, newBus]);
    setShowModal(false);
    setFormData({ code: '', name: '', capacity: '', status: 'Active' });
    alert('Bus added successfully!');
  };

  const handleDelete = (code: string) => {
    if (confirm(`Are you sure you want to delete ${code}?`)) {
      setBuses(buses.filter(bus => bus.code !== code));
      alert('Bus deleted successfully!');
    }
  };

  const handleEdit = (code: string) => {
    alert(`Edit functionality for ${code} - This would open a modal with the bus details`);
  };

  const filteredBuses = buses.filter(bus =>
    Object.values(bus).some(value =>
      value.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="container">
      <Sidebar isAdmin />
      <main className="main-content">
        <Header title="Buses" showBackButton showSearch={false} />
        
        <div className="content-area">
          <div className={styles.searchContainer}>
            <div className={styles.searchBox}>
              <span style={{ color: '#6b7280' }}>🔍</span>
              <input
                type="text"
                placeholder="Search Buses"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              +Add New Bus
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Bus Code</th>
                  <th>Bus Name</th>
                  <th>Capacity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBuses.map((bus) => (
                  <tr key={bus.code}>
                    <td>{bus.code}</td>
                    <td>{bus.name}</td>
                    <td>{bus.capacity}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${bus.status === 'Active' ? styles.statusActive : styles.statusInactive}`}>
                        {bus.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionIcons}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => handleEdit(bus.code)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          className={styles.iconBtn}
                          onClick={() => handleDelete(bus.code)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className={styles.modal} onClick={(e) => {
          if (e.target === e.currentTarget) setShowModal(false);
        }}>
          <div className={styles.modalContent}>
            <h2 style={{ marginBottom: '20px' }}>Add New Bus</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="busCode">Bus Code</label>
                <input
                  type="text"
                  id="busCode"
                  className="form-control"
                  placeholder="Enter bus code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="busName">Bus Name</label>
                <input
                  type="text"
                  id="busName"
                  className="form-control"
                  placeholder="Enter bus name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="capacity">Capacity</label>
                <input
                  type="number"
                  id="capacity"
                  className="form-control"
                  placeholder="Enter capacity"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  Save
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
