import React, { useState, useEffect } from 'react';
import detailedData from './detailed_info.json';
import dishesData from './dishes.json';
import './App.css';

function App() {
  const [currentDate, setCurrentDate] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [reservationsForDate, setReservationsForDate] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showEmails, setShowEmails] = useState({});
  const [showReviews, setShowReviews] = useState({});
  const [currentView, setCurrentView] = useState('different'); // 'different', 'same', 'chef'
  const [expandedCards, setExpandedCards] = useState({});
  const [chefViewType, setChefViewType] = useState('groups'); // 'groups' or 'dishes'
  const [searchTerm, setSearchTerm] = useState('');
  const [deletedTables, setDeletedTables] = useState(new Set());

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

  // Calculate priority score for ranking in Same Day View
  const calculatePriority = (reservation, guestData) => {
    let score = 0;
    
    // Order cost scoring (higher cost = higher priority)
    const totalOrderCost = reservation.orders.reduce((sum, order) => sum + order.price, 0);
    score += totalOrderCost * 2; // 2 points per dollar
    
    // Special accommodations scoring (high weight for needs)
    if (reservation.notes?.customer_insights?.special_accommodations) {
      score += reservation.notes.customer_insights.special_accommodations.length * 50;
    }
    
    // Dietary restrictions scoring (high weight for needs)
    const dietaryTags = reservation.orders.reduce((acc, order) => acc + order.dietary_tags.length, 0);
    score += dietaryTags * 30;
    
    // Email complexity (longer emails indicate more special requests)
    if (guestData.emails && guestData.emails.length > 0) {
      const avgEmailLength = guestData.emails.reduce((acc, email) => acc + email.combined_thread.length, 0) / guestData.emails.length;
      if (avgEmailLength > 200) score += 25;
      if (avgEmailLength > 400) score += 25; // Extra points for very long emails
    }
    
    // Additional customer values that indicate high maintenance
    if (reservation.notes?.customer_insights?.customer_values) {
      const highMaintenanceValues = ['personalized service', 'confidential atmosphere', 'enthusiastic staff'];
      const matches = reservation.notes.customer_insights.customer_values.filter(value => 
        highMaintenanceValues.some(hmv => value.toLowerCase().includes(hmv.toLowerCase()))
      );
      score += matches.length * 15;
    }
    
    return score;
  };

  // Get all reservations for Same Day View
  const getAllReservations = () => {
    const allReservations = [];
    
    detailedData.diners.forEach(diner => {
      diner.reservations.forEach(reservation => {
        allReservations.push({
          ...reservation,
          guestName: diner.name,
          guestData: diner,
          priority: calculatePriority(reservation, diner)
        });
      });
    });
    
    // Sort by priority (highest first)
    return allReservations.sort((a, b) => b.priority - a.priority);
  };

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

  const toggleEmails = (index) => {
    setShowEmails(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleReviews = (index) => {
    setShowReviews(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const toggleExpandCard = (index) => {
    setExpandedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const renderInsightTags = (items, className, justifications = {}) => {
    if (!items || (Array.isArray(items) && items.length === 0)) return null;
    
    const itemsArray = Array.isArray(items) ? items : [items];
    return itemsArray.map((item, index) => {
      const justification = justifications[item];
      
      if (justification) {
        return (
          <div key={index} className="tooltip-container">
            <span className={`${className} has-tooltip`}>
              {item}
            </span>
            <div className="tooltip">
              {justification}
            </div>
          </div>
        );
      }
      
      return (
        <span key={index} className={className}>
          {item}
        </span>
      );
    });
  };

  const renderInsightBadge = (value, className, justification = null) => {
    if (!value && value !== false) return null;
    
    const displayText = typeof value === 'boolean' ? (value ? 'New Customer' : 'Returning Customer') : value;
    
    if (justification) {
      return (
        <div className="tooltip-container">
          <span className={`insight-badge ${className} has-tooltip`}>
            {displayText}
          </span>
          <div className="tooltip">
            {justification}
          </div>
        </div>
      );
    }
    
    return (
      <span className={`insight-badge ${className}`}>
        {displayText}
      </span>
    );
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Chef View Functions
  const getGroupsData = () => {
    return dishesData.parties
      .filter(party => !deletedTables.has(party.party_id))
      .filter(party => 
        searchTerm === '' || 
        party.party_id.toString() === searchTerm ||
        party.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        party.dishes.some(dish => dish.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => a.table_number - b.table_number);
  };

  const getDishesData = () => {
    const dishesMap = new Map();
    
    // Normalize dish names to group similar dishes
    const normalizeDishName = (dishName) => {
      return dishName.replace(/^Boeuf\b/i, 'Beef');
    };
    
    dishesData.parties
      .filter(party => !deletedTables.has(party.party_id))
      .forEach(party => {
        party.dishes.forEach(dish => {
          const normalizedName = normalizeDishName(dish.name);
          const dishKey = normalizedName;
          if (!dishesMap.has(dishKey)) {
            dishesMap.set(dishKey, {
              name: normalizedName,
              variations: []
            });
          }
          
          // Create variation key based on dietary exceptions
          const variationKey = dish.dietary_exceptions.length > 0 ? 
            dish.dietary_exceptions.sort().join(', ') : 'standard';
          
          const existingVariation = dishesMap.get(dishKey).variations.find(v => v.variation === variationKey);
          
          if (existingVariation) {
            existingVariation.orders.push({
              party_id: party.party_id,
              table_number: party.table_number,
              customer_name: party.customer_name,
              price: dish.price
            });
            existingVariation.quantity += 1;
          } else {
            dishesMap.get(dishKey).variations.push({
              variation: variationKey,
              dietary_exceptions: dish.dietary_exceptions,
              quantity: 1,
              orders: [{
                party_id: party.party_id,
                table_number: party.table_number,
                customer_name: party.customer_name,
                price: dish.price
              }]
            });
          }
        });
      });
    
    return Array.from(dishesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const deleteTable = (tableId) => {
    setDeletedTables(prev => new Set([...prev, tableId]));
  };

  if (showCalendar) {
    return <Calendar />;
  }

  // Render Same Day View
  if (currentView === 'same') {
    const allReservations = getAllReservations();
    
    return (
      <div className="app">
        <header className="header">
          <h1>French Laudure</h1>
          <div className="date-navigation">
            <div className="current-date">
              <h2>All Reservations (Same Day View)</h2>
            </div>
          </div>
        </header>

        <main className="main-content">
          <div className="reservations-summary">
            <h3>All Reservations: {allReservations.length} parties - {allReservations.reduce((sum, res) => sum + res.number_of_people, 0)} guests</h3>
          </div>

          <div className="same-day-view">
            {allReservations.map((reservation, index) => (
              <div key={index} className="compact-reservation-card">
                <div className="compact-header">
                  <span className="compact-name">{reservation.guestName}</span>
                  <div style={{display: 'flex', gap: '0.5rem', alignItems: 'center'}}>
                    <span className="party-size">{reservation.number_of_people} guests</span>
                    <span className="priority-badge">#{index + 1}</span>
                  </div>
                </div>

                <div className="compact-orders">
                  <h6>Orders:</h6>
                  <div className="orders-summary">
                    {reservation.orders.map((order, orderIdx) => (
                      <span key={orderIdx} className="order-chip">
                        {order.item} (${order.price})
                      </span>
                    ))}
                  </div>
                </div>

                {reservation.notes?.customer_insights?.special_accommodations && (
                  <div className="compact-accommodations">
                    <h6>Special Needs:</h6>
                    <div className="accommodation-chips">
                      {reservation.notes.customer_insights.special_accommodations.map((acc, accIdx) => (
                        <span key={accIdx} className="accommodation-chip">
                          {acc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  className="show-more-btn"
                  onClick={() => toggleExpandCard(index)}
                >
                  {expandedCards[index] ? 'Show Less' : 'Show More Info'}
                </button>

                {expandedCards[index] && (
                  <div className="expanded-details">
                    {reservation.notes?.customer_insights && (
                      <div className="ai-insights">
                        <div className="insights-grid">
                          {/* Customer Values */}
                          {reservation.notes.customer_insights.customer_values && (
                            <div className="insight-item">
                              <span className="insight-label">Values</span>
                              <div className="insight-tags">
                                {renderInsightTags(reservation.notes.customer_insights.customer_values, 'insight-tag values', reservation.notes.customer_insights.customer_values_justifications)}
                              </div>
                            </div>
                          )}

                          {/* New/Returning Customer */}
                          {reservation.notes.customer_insights.hasOwnProperty('is_new_customer') && (
                            <div className="insight-item">
                              <span className="insight-label">Customer Type</span>
                              <div className="insight-tags">
                                {renderInsightBadge(
                                  reservation.notes.customer_insights.is_new_customer, 
                                  reservation.notes.customer_insights.is_new_customer ? 'new' : 'returning',
                                  reservation.notes.customer_insights.is_new_customer_justification
                                )}
                              </div>
                            </div>
                          )}

                          {/* Staff Interaction Preferences */}
                          {reservation.notes.customer_insights.staff_interaction_preferences && (
                            <div className="insight-item">
                              <span className="insight-label">Staff Preferences</span>
                              <div className="insight-tags">
                                {renderInsightTags(reservation.notes.customer_insights.staff_interaction_preferences, 'insight-tag staff', reservation.notes.customer_insights.staff_interaction_preferences_justifications)}
                              </div>
                            </div>
                          )}

                          {/* Taste Preferences */}
                          {reservation.notes.customer_insights.taste_preferences && (
                            <div className="insight-item">
                              <span className="insight-label">Taste Profile</span>
                              <div className="insight-tags">
                                {renderInsightBadge(
                                  reservation.notes.customer_insights.taste_preferences, 
                                  `taste-${reservation.notes.customer_insights.taste_preferences}`,
                                  reservation.notes.customer_insights.taste_preferences_justification
                                )}
                              </div>
                            </div>
                          )}

                          {/* Personal Interests */}
                          {reservation.notes.customer_insights.personal_interests && (
                            <div className="insight-item">
                              <span className="insight-label">Interests</span>
                              <div className="insight-tags">
                                {renderInsightTags(reservation.notes.customer_insights.personal_interests, 'insight-tag interests', reservation.notes.customer_insights.personal_interests_justifications)}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="action-buttons">
                      {reservation.guestData.emails && reservation.guestData.emails.length > 0 && (
                        <button 
                          className="action-button"
                          onClick={() => toggleEmails(index)}
                        >
                          {showEmails[index] ? 'Hide Email' : 'Show Email'}
                        </button>
                      )}
                      
                      {reservation.guestData.reviews && reservation.guestData.reviews.length > 0 && (
                        <button 
                          className="action-button"
                          onClick={() => toggleReviews(index)}
                        >
                          {showReviews[index] ? 'Hide Reviews' : 'Show Reviews'}
                        </button>
                      )}
                    </div>

                    {showEmails[index] && reservation.guestData.emails && (
                      <div className="email-section">
                        <h6>Recent Email:</h6>
                        {reservation.guestData.emails.map((email, emailIdx) => (
                          <div key={emailIdx} className="email-item">
                            <div className="email-subject"><strong>Subject:</strong> {email.subject}</div>
                            <div className="email-date"><strong>Date:</strong> {email.date}</div>
                            <div className="email-content">{email.combined_thread}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {showReviews[index] && reservation.guestData.reviews && (
                      <div className="reviews-section">
                        <h6>Previous Reviews:</h6>
                        {reservation.guestData.reviews.map((review, reviewIdx) => (
                          <div key={reviewIdx} className="review-item">
                            <div className="review-header">
                              <strong>{review.restaurant_name}</strong>
                              <span className="review-rating">★ {review.rating}/5</span>
                            </div>
                            <div className="review-date">{review.date}</div>
                            <div className="review-content">{review.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-left">
              <a href="#" className="footer-link">Terms & policies</a>
              <a href="#" className="footer-link">Privacy policy</a>
            </div>
            <div className="footer-right">
              <button onClick={() => setCurrentView('different')} className="footer-link">Different Days View</button>
              <span className="footer-link active-view">Same Days View</span>
              <button onClick={() => setCurrentView('chef')} className="footer-link">Chef View</button>
              <button onClick={scrollToTop} className="back-to-top">
                Back to top
              </button>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© French Laudure 2024. All Rights Reserved</p>
          </div>
        </footer>
      </div>
    );
  }

  // Render Chef View
  if (currentView === 'chef') {
    const groupsData = getGroupsData();
    const dishesDataProcessed = getDishesData();
    
    return (
      <div className="app">
        <header className="header">
          <h1>French Laudure</h1>
          <div className="date-navigation">
            <div className="current-date">
              <h2>Chef View - Kitchen Dashboard</h2>
            </div>
          </div>
        </header>

        <main className="main-content">
          <div className="chef-toggles">
            <button 
              className={`toggle-button ${chefViewType === 'groups' ? 'active' : ''}`}
              onClick={() => setChefViewType('groups')}
            >
              Groups
            </button>
            <button 
              className={`toggle-button ${chefViewType === 'dishes' ? 'active' : ''}`}
              onClick={() => setChefViewType('dishes')}
            >
              Dishes
            </button>
          </div>

          {chefViewType === 'groups' ? (
            <div className="chef-groups-view">
              <div className="reservations-summary">
                <h3>All Tables: {groupsData.length} tables</h3>
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Search by table number, customer, or dish..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
              
              <div className="groups-list">
                {groupsData.map((party) => (
                  <div key={party.party_id} className="group-card">
                    <button 
                      className="delete-table-btn"
                      onClick={() => deleteTable(party.party_id)}
                      title="Remove this table"
                    >
                      ✕
                    </button>
                    <div className="group-header">
                      <h4>Table {party.party_id}</h4>
                    </div>
                    
                    <div className="group-dishes">
                      <div className="dishes-list">
                        {party.dishes.map((dish, dishIdx) => (
                          <div key={dishIdx} className="dish-item">
                            <span className="dish-name">{dish.name}</span>
                            <span className="dish-price">${dish.price}</span>
                            {dish.dietary_exceptions.length > 0 && (
                              <div className="dish-exceptions">
                                {dish.dietary_exceptions.map((exception, excIdx) => (
                                  <span key={excIdx} className="exception-tag">
                                    {exception}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {party.special_accommodations.length > 0 && (
                      <div className="group-accommodations">
                        <h5>Special Accommodations:</h5>
                        <div className="accommodation-chips">
                          {party.special_accommodations.map((acc, accIdx) => (
                            <span key={accIdx} className="accommodation-chip">
                              {acc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="chef-dishes-view">
              <div className="reservations-summary">
                <h3>All Dishes: {dishesDataProcessed.length} unique dishes</h3>
              </div>
              
              <div className="dishes-grid">
                {dishesDataProcessed.map((dish) => (
                  <div key={dish.name} className="dish-tile">
                    <div className="dish-tile-header">
                      <h4>{dish.name}</h4>
                      <span className="tile-orders">
                        {dish.variations.reduce((sum, v) => sum + v.quantity, 0)}
                      </span>
                    </div>
                    
                    <div className="dish-tables">
                      {dish.variations.map((variation, varIdx) => 
                        variation.orders.map((order, orderIdx) => (
                          <span key={`${varIdx}-${orderIdx}`} className="table-chip">
                            {order.party_id}
                            {variation.dietary_exceptions.length > 0 && (
                              <span className="chip-exceptions">
                                ({variation.dietary_exceptions.join(', ')})
                              </span>
                            )}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-left">
              <a href="#" className="footer-link">Terms & policies</a>
              <a href="#" className="footer-link">Privacy policy</a>
            </div>
            <div className="footer-right">
              <button onClick={() => setCurrentView('different')} className="footer-link">Different Days View</button>
              <button onClick={() => setCurrentView('same')} className="footer-link">Same Days View</button>
              <span className="footer-link active-view">Chef View</span>
              <button onClick={scrollToTop} className="back-to-top">
                Back to top
              </button>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© French Laudure 2024. All Rights Reserved</p>
          </div>
        </footer>
      </div>
    );
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
          <h3>Today's Reservations: {reservationsForDate.length} parties - {reservationsForDate.reduce((sum, res) => sum + res.number_of_people, 0)} guests</h3>
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
                    {reservation.notes.customer_insights && (
                      <div className="insights-grid">
                        {/* Customer Values */}
                        {reservation.notes.customer_insights.customer_values && (
                          <div className="insight-item">
                            <span className="insight-label">Values</span>
                            <div className="insight-tags">
                              {renderInsightTags(reservation.notes.customer_insights.customer_values, 'insight-tag values', reservation.notes.customer_insights.customer_values_justifications)}
                            </div>
                          </div>
                        )}

                        {/* New/Returning Customer */}
                        {reservation.notes.customer_insights.hasOwnProperty('is_new_customer') && (
                          <div className="insight-item">
                            <span className="insight-label">Customer Type</span>
                            <div className="insight-tags">
                              {renderInsightBadge(
                                reservation.notes.customer_insights.is_new_customer, 
                                reservation.notes.customer_insights.is_new_customer ? 'new' : 'returning',
                                reservation.notes.customer_insights.is_new_customer_justification
                              )}
                            </div>
                          </div>
                        )}

                        {/* Special Accommodations */}
                        {reservation.notes.customer_insights.special_accommodations && (
                          <div className="insight-item">
                            <span className="insight-label">Accommodations</span>
                            <div className="insight-tags">
                              {renderInsightTags(reservation.notes.customer_insights.special_accommodations, 'insight-tag accommodations', reservation.notes.customer_insights.special_accommodations_justifications)}
                            </div>
                          </div>
                        )}

                        {/* Staff Interaction Preferences */}
                        {reservation.notes.customer_insights.staff_interaction_preferences && (
                          <div className="insight-item">
                            <span className="insight-label">Staff Preferences</span>
                            <div className="insight-tags">
                              {renderInsightTags(reservation.notes.customer_insights.staff_interaction_preferences, 'insight-tag staff', reservation.notes.customer_insights.staff_interaction_preferences_justifications)}
                            </div>
                          </div>
                        )}

                        {/* Taste Preferences */}
                        {reservation.notes.customer_insights.taste_preferences && (
                          <div className="insight-item">
                            <span className="insight-label">Taste Profile</span>
                            <div className="insight-tags">
                              {renderInsightBadge(
                                reservation.notes.customer_insights.taste_preferences, 
                                `taste-${reservation.notes.customer_insights.taste_preferences}`,
                                reservation.notes.customer_insights.taste_preferences_justification
                              )}
                            </div>
                          </div>
                        )}

                        {/* Personal Interests */}
                        {reservation.notes.customer_insights.personal_interests && (
                          <div className="insight-item">
                            <span className="insight-label">Interests</span>
                            <div className="insight-tags">
                              {renderInsightTags(reservation.notes.customer_insights.personal_interests, 'insight-tag interests', reservation.notes.customer_insights.personal_interests_justifications)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="action-buttons">
                      {reservation.guestData.emails && reservation.guestData.emails.length > 0 && (
                        <button 
                          className="action-button"
                          onClick={() => toggleEmails(index)}
                        >
                          {showEmails[index] ? 'Hide Email' : 'Show Email'}
                        </button>
                      )}
                      
                      {reservation.guestData.reviews && reservation.guestData.reviews.length > 0 && (
                        <button 
                          className="action-button"
                          onClick={() => toggleReviews(index)}
                        >
                          {showReviews[index] ? 'Hide Reviews' : 'Show Reviews'}
                        </button>
                      )}
                    </div>

                    {showEmails[index] && reservation.guestData.emails && (
                      <div className="email-section">
                        <h6>Recent Email:</h6>
                        {reservation.guestData.emails.map((email, emailIdx) => (
                          <div key={emailIdx} className="email-item">
                            <div className="email-subject"><strong>Subject:</strong> {email.subject}</div>
                            <div className="email-date"><strong>Date:</strong> {email.date}</div>
                            <div className="email-content">{email.combined_thread}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {showReviews[index] && reservation.guestData.reviews && (
                      <div className="reviews-section">
                        <h6>Previous Reviews:</h6>
                        {reservation.guestData.reviews.map((review, reviewIdx) => (
                          <div key={reviewIdx} className="review-item">
                            <div className="review-header">
                              <strong>{review.restaurant_name}</strong>
                              <span className="review-rating">★ {review.rating}/5</span>
                            </div>
                            <div className="review-date">{review.date}</div>
                            <div className="review-content">{review.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-left">
            <a href="#" className="footer-link">Terms & policies</a>
            <a href="#" className="footer-link">Privacy policy</a>
          </div>
          <div className="footer-right">
            <span className="footer-link active-view">Different Days View</span>
            <button onClick={() => setCurrentView('same')} className="footer-link">Same Days View</button>
            <button onClick={() => setCurrentView('chef')} className="footer-link">Chef View</button>
            <button onClick={scrollToTop} className="back-to-top">
              Back to top
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© French Laudure 2024. All Rights Reserved</p>
        </div>
      </footer>
    </div>
  );
}

export default App; 