import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../api/axios';
import { ItinerarySkeleton } from '../components/Skeleton';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar, MapPin, Clock, Trash2, AlertTriangle } from 'lucide-react';

export default function Itinerary() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [trip, setTrip] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ day: '', title: '', description: '', location: '', time: '' });
  const [itemToDelete, setItemToDelete] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const toast = useToast();

  const fetchData = useCallback(async () => {
    try {
      const [tripRes, itemsRes] = await Promise.all([API.get(`/trips/${id}`), API.get(`/itinerary/${id}`)]);
      setTrip(tripRes.data);
      setItems(itemsRes.data);
    } catch { 
      // Error fetching data
    }
    setLoading(false);
  }, [id]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();

    // Validation
    const errors = {};
    if (!form.day || Number(form.day) < 1) errors.day = 'Enter a valid day number.';
    if (!form.title.trim()) errors.title = 'Activity title is required.';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    
    // 1. Optimistic UI Update
    const optimisticItem = { ...form, _id: 'temp-' + Date.now(), isOptimistic: true };
    setItems((prev) => [...prev, optimisticItem].sort((a, b) => a.day - b.day));
    const savedTitle = form.title.trim();
    setForm({ day: '', title: '', description: '', location: '', time: '' });
    setShowForm(false);

    // 2. Background API Sync
    try {
      const { data } = await API.post(`/itinerary/${id}`, form);
      setItems((prev) => prev.map(item => item._id === optimisticItem._id ? data : item).sort((a, b) => a.day - b.day));
      toast.success(`"${savedTitle}" added to Day ${form.day || data.day}.`, 'Itinerary Updated');
    } catch { 
      setItems((prev) => prev.filter(item => item._id !== optimisticItem._id)); // Revert on failure
      toast.error('Failed to add to itinerary. Please check your connection.', 'Error');
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const itemId = itemToDelete;
    setItemToDelete(null);
    
    // 1. Optimistic UI Update
    const itemToDeleteObj = items.find(i => i._id === itemId);
    setItems((prev) => prev.filter(i => i._id !== itemId));
    
    // 2. Background API Sync
    try {
      await API.delete(`/itinerary/${itemId}`);
      toast.success('Itinerary item removed.', 'Deleted');
    } catch { 
      if (itemToDeleteObj) {
         setItems((prev) => [...prev, itemToDeleteObj].sort((a, b) => a.day - b.day)); // Revert on failure
         toast.error('Failed to delete item. Please try again.', 'Error');
      }
    }
  };

  const groupedByDay = items.reduce((acc, item) => {
    const day = `Day ${item.day}`;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {});

  if (loading) return <ItinerarySkeleton />;

  return (
    <div className="min-h-screen bg-bg page-content">
      <div className="max-w-3xl mx-auto px-6 sm:px-6 py-8">

        <Link to={`/trip/${id}`} className="inline-flex items-center gap-1 text-text-secondary hover:text-navy text-sm no-underline transition-colors duration-150 mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>← Back to Trip</Link>

        {/* Error Message */}
        {errorMsg && (
          <div className="mb-6 bg-danger/10 border border-danger text-danger p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle size={18} className="shrink-0" />
            <p className="text-sm font-semibold">{errorMsg}</p>
            <button onClick={() => setErrorMsg('')} className="ml-auto text-danger hover:text-danger-dark border-0 bg-transparent cursor-pointer">✕</button>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-navy flex items-center gap-2" style={{ fontFamily: "'Poppins', sans-serif" }}>
              <Calendar size={20} strokeWidth={1.5} className="text-primary" />
              Itinerary
            </h2>
            {trip && <p className="text-text-secondary text-sm mt-0.5" style={{ fontFamily: "'Inter', sans-serif" }}>{trip.name} • {trip.destination}</p>}
          </div>
          <button onClick={() => setShowForm(!showForm)} id="itinerary-add-toggle" className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors duration-150 cursor-pointer border-0" style={{ fontFamily: "'Inter', sans-serif" }}>
            {showForm ? '✕ Cancel' : '+ Add Item'}
          </button>
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="bg-card rounded- p-6 mb-6 border border-primary-100" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h4 className="font-semibold text-navy mb-4 text-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>New Itinerary Item</h4>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Day Number</label>
                  <input type="number" placeholder="1" min="1" id="itinerary-day" className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy transition-colors ${formErrors.day ? 'border-danger' : 'border-border'}`} style={{ fontFamily: "'Inter', sans-serif" }} value={form.day} onChange={(e) => { setForm({ ...form, day: e.target.value }); if (formErrors.day) setFormErrors(p => ({...p, day: ''})); }} />
                  {formErrors.day && <p className="text-danger text-[10px] font-semibold mt-1">{formErrors.day}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Time</label>
                  <DatePicker selected={form.time ? new Date(`1970-01-01T${form.time}:00`) : null} onChange={(date) => { if (date) { const h = String(date.getHours()).padStart(2,'0'); const m = String(date.getMinutes()).padStart(2,'0'); setForm({ ...form, time: `${h}:${m}` }); } else setForm({ ...form, time: '' }); }} showTimeSelect showTimeSelectOnly timeIntervals={15} timeCaption="Time" dateFormat="h:mm aa" placeholderText="hh:mm" id="itinerary-time" className="w-full border border-border rounded-xl px-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy" wrapperClassName="w-full" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Activity Title</label>
                <input type="text" placeholder="e.g. Visit a local landmark" id="itinerary-title" className={`w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy transition-colors ${formErrors.title ? 'border-danger' : 'border-border'}`} style={{ fontFamily: "'Inter', sans-serif" }} value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); if (formErrors.title) setFormErrors(p => ({...p, title: ''})); }} />
                {formErrors.title && <p className="text-danger text-[10px] font-semibold mt-1">{formErrors.title}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Location</label>
                <input type="text" placeholder="e.g. Gateway of India" id="itinerary-location" className="w-full border border-border rounded-xl px-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy" style={{ fontFamily: "'Inter', sans-serif" }} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-navy mb-1" style={{ fontFamily: "'Inter', sans-serif" }}>Notes</label>
                <textarea placeholder="Additional notes (optional)" rows={2} id="itinerary-description" className="w-full border border-border rounded-xl px-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary bg-white text-navy resize-y" style={{ fontFamily: "'Inter', sans-serif" }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <button type="submit" id="itinerary-submit" className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-xl text-sm font-semibold transition-colors duration-150 cursor-pointer border-0" style={{ fontFamily: "'Inter', sans-serif" }}>
                Add to Itinerary
              </button>
            </form>
          </div>
        )}

        {/* Itinerary Timeline */}
        {Object.keys(groupedByDay).length === 0 ? (
          <div className="text-center py-16 bg-card rounded- border border-border" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex justify-center mb-3"><Calendar size={40} strokeWidth={1.5} className="text-text-muted opacity-60" /></div>
            <p className="text-text-secondary text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>No activities added yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDay).map(([day, dayItems]) => (
              <div key={day}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-primary text-white px-6 py-1 rounded- text-sm font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>{day}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <div className="space-y-3 ml-2">
                  {dayItems.map(item => (
                    <div key={item._id} className={`bg-card rounded- p-6 flex justify-between items-start border border-border hover:border-primary-100 transition-all duration-300 ${item.isOptimistic ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'}`} style={{ boxShadow: 'var(--shadow-sm)' }}>
                      <div className="flex gap-3">
                        <div className="w-1 bg-primary rounded- min-h-full" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-navy text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>{item.title}</p>
                            {item.time && (
                              <span className="text-xs bg-bg text-text-secondary px-2 py-0.5 rounded- border border-border-light flex items-center gap-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                                <Clock size={10} strokeWidth={1.5} />{item.time}
                              </span>
                            )}
                            {item.isOptimistic && <span className="text-[9px] text-text-muted italic ml-2">Saving...</span>}
                          </div>
                          {item.location && (
                            <p className="text-sm text-text-secondary mt-0.5 flex items-center gap-1" style={{ fontFamily: "'Inter', sans-serif" }}>
                              <MapPin size={12} strokeWidth={1.5} className="text-accent shrink-0" />{item.location}
                            </p>
                          )}
                          {item.description && <p className="text-sm text-text-muted mt-1" style={{ fontFamily: "'Inter', sans-serif" }}>{item.description}</p>}
                        </div>
                      </div>
                      <button onClick={() => setItemToDelete(item._id)} disabled={item.isOptimistic} className="text-danger/60 hover:text-danger disabled:opacity-30 text-sm ml-3 shrink-0 cursor-pointer bg-transparent border-0 p-1">
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {itemToDelete && <ConfirmModal title="Delete item?" message="Are you sure you want to delete this itinerary item?" onConfirm={confirmDelete} onCancel={() => setItemToDelete(null)} />}
    </div>
  );
}