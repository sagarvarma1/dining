import React, { useState, useEffect } from 'react';
import detailedData from './detailed_info.json';
import './App.css';

function App() {
  const [currentDate, setCurrentDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [reservationsForDate, setReservationsForDate] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    // Extract all unique reservation dates and sort them
    const reservationDates = new Set();
    
    detailedData.diners.forEach(diner => {
      diner.reservations.forEach(reservation => {
        reservationDates.add(reservation.date);
      });
    });

    const sortedDates = Array.from(reservationDates).sort();
    setAvailableDates(sortedDates);
    
    // Set to earliest date
    if (sortedDates.length > 0) {
      setCurrentDate(sortedDates[0]);
    }
  }, []);

  useEffect(() => {
    // Get reservations for current date
    const reservations = [];
    
    detailedData.diners.forEach(diner => {
      diner.reservations.forEach(reservation => {
        if (reservation.date === currentDate) {
          reservations.push({
            ...reservation,
            guestName: diner.name,
            guestData: diner
          });
        }
      });
    });

    setReservationsForDate(reservations);
  }, [currentDate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const selectDateFromCalendar = (dateString) => {
    setCurrentDate(dateString);
    setShowCalendar(false);
  };

  const Calendar = () => {
    // Get the date range for the calendar
    const earliestDate = new Date(availableDates[0]);
    const latestDate = new Date(availableDates[availableDates.length - 1]);
    
    // Create calendar months to display in chronological order
    const allMonths = [];
    const current = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);
    const end = new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, 0);
    
    while (current <= end) {
      allMonths.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    // Find the current date's month for initial display
    const currentSelectedDate = new Date(currentDate);
    const initialMonthIndex = allMonths.findIndex(month => 
      month.getFullYear() === currentSelectedDate.getFullYear() && 
      month.getMonth() === currentSelectedDate.getMonth()
    );

    const [currentMonthIndex, setCurrentMonthIndex] = useState(
      initialMonthIndex >= 0 ? initialMonthIndex : 0
    );

    const goToPreviousMonth = () => {
      if (currentMonthIndex > 0) {
        setCurrentMonthIndex(currentMonthIndex - 1);
      }
    };

    const goToNextMonth = () => {
      if (currentMonthIndex < allMonths.length - 1) {
        setCurrentMonthIndex(currentMonthIndex + 1);
      }
    };

    const renderMonth = (monthDate) => {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
      }
      
      // Add days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasReservation = availableDates.includes(dateString);
        const isSelected = dateString === currentDate;
        
        days.push(
          <div 
            key={day} 
            className={`calendar-day ${hasReservation ? 'has-reservation' : ''} ${isSelected ? 'selected' : ''}`}
            onClick={() => hasReservation && selectDateFromCalendar(dateString)}
          >
            {day}
          </div>
        );
      }

      return (
        <div className="single-calendar-month">
          <div className="month-navigation">
            <button 
              onClick={goToPreviousMonth}
              disabled={currentMonthIndex === 0}
              className="month-nav-button"
            >
              ←
            </button>
            
            <h3 className="month-header">
              {monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            
            <button 
              onClick={goToNextMonth}
              disabled={currentMonthIndex === allMonths.length - 1}
              className="month-nav-button"
            >
              →
            </button>
          </div>
          
          <div className="weekday-headers">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday-header">{day}</div>
            ))}
          </div>
          <div className="calendar-grid">
            {days}
          </div>
        </div>
      );
    };

    return (
      <div className="calendar-overlay">
        <div className="calendar-modal single-month">
          <div className="calendar-header">
            <h2>Select Date</h2>
            <button 
              className="close-calendar"
              onClick={() => setShowCalendar(false)}
            >
              ✕
            </button>
          </div>
          <div className="calendar-legend">
            <div className="legend-item">
              <div className="legend-color has-reservation"></div>
              <span>Has Reservations</span>
            </div>
            <div className="legend-item">
              <div className="legend-color selected"></div>
              <span>Selected Date</span>
            </div>
          </div>
          <div className="single-month-container">
            {renderMonth(allMonths[currentMonthIndex])}
          </div>
        </div>
      </div>
    );
  };

  if (showCalendar) {
    return <Calendar />;
  }

  return (
    <div className="app">
      <header className="header">
        <h1>French Laudure</h1>
        <div className="date-navigation">
          <div className="current-date">
            <h2>{formatDate(currentDate)}</h2>
            <button 
              onClick={() => setShowCalendar(true)}
              className="calendar-button"
            >
              See Calendar
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="reservations-summary">
          <h3>Today's Reservations: {reservationsForDate.length} parties</h3>
          <p>Total guests: {reservationsForDate.reduce((sum, res) => sum + res.number_of_people, 0)}</p>
        </div>

        <div className="reservations-list">
          {reservationsForDate.length === 0 ? (
            <div className="no-reservations">
              <p>No reservations for this date.</p>
            </div>
          ) : (
            reservationsForDate.map((reservation, index) => (
              <div key={index} className="reservation-card">
                <div className="reservation-header">
                  <h4>{reservation.guestName}</h4>
                  <span className="party-size">{reservation.number_of_people} guests</span>
                </div>
                
                <div className="orders-compact">
                  <h5>Orders:</h5>
                  <div className="orders-row">
                    {reservation.orders.map((order, orderIndex) => (
                      <div key={orderIndex} className="order-compact">
                        <span className="item-name">{order.item}</span>
                        <span className="item-price">${order.price}</span>
                        {order.dietary_tags.length > 0 && (
                          <div className="dietary-tags">
                            {order.dietary_tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className="dietary-tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {reservation.notes && (
                  <div className="ai-insights">
                    {reservation.notes.summary && (
                      <div className="insight-summary">
                        <strong>Summary:</strong> {reservation.notes.summary}
                      </div>
                    )}

                    {reservation.notes.customer_insights && (
                      <div className="insights-grid">
                        {reservation.notes.customer_insights.customer_values && (
                          <div className="insight-item">
                            <span className="insight-label">Values:</span>
                            <div className="insight-tags">
                              {reservation.notes.customer_insights.customer_values.map((value, idx) => (
                                <span key={idx} className="insight-tag values">{value}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {reservation.notes.customer_insights.hasOwnProperty('is_new_customer') && (
                          <div className="insight-item">
                            <span className="insight-label">Customer Type:</span>
                            <span className={`insight-badge ${reservation.notes.customer_insights.is_new_customer ? 'new' : 'returning'}`}>
                              {reservation.notes.customer_insights.is_new_customer ? 'New Customer' : 'Returning Customer'}
                            </span>
                          </div>
                        )}

                        {reservation.notes.customer_insights.special_accommodations && (
                          <div className="insight-item">
                            <span className="insight-label">Special Needs:</span>
                            <div className="insight-tags">
                              {reservation.notes.customer_insights.special_accommodations.map((accommodation, idx) => (
                                <span key={idx} className="insight-tag accommodations">{accommodation}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {reservation.notes.customer_insights.taste_preferences && (
                          <div className="insight-item">
                            <span className="insight-label">Taste:</span>
                            <span className={`insight-badge taste-${reservation.notes.customer_insights.taste_preferences}`}>
                              {reservation.notes.customer_insights.taste_preferences}
                            </span>
                          </div>
                        )}

                        {reservation.notes.customer_insights.staff_interaction_preferences && (
                          <div className="insight-item">
                            <span className="insight-label">Staff Style:</span>
                            <div className="insight-tags">
                              {reservation.notes.customer_insights.staff_interaction_preferences.map((pref, idx) => (
                                <span key={idx} className="insight-tag staff">{pref}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {reservation.notes.customer_insights.personal_interests && (
                          <div className="insight-item">
                            <span className="insight-label">Interests:</span>
                            <div className="insight-tags">
                              {reservation.notes.customer_insights.personal_interests.map((interest, idx) => (
                                <span key={idx} className="insight-tag interests">{interest}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default App; 