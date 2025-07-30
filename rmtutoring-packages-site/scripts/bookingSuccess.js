(function () {
  // Optionally load Font Awesome if not already present
  function loadFontAwesome() {
    if (!document.querySelector('link[href*="font-awesome"],link[href*="fontawesome"]')) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    }
  }

  function getQueryParams(url) {
    let params = {};
    let parser = document.createElement('a');
    parser.href = url;
    let query = parser.search.substring(1);
    let vars = query.split('&');
    for (let i = 0; i < vars.length; i++) {
      let pair = vars[i].split('=');
      let key = decodeURIComponent(pair[0]);
      let val = decodeURIComponent(pair[1] || '');
      if (params[key] !== undefined) {
        if (!Array.isArray(params[key])) params[key] = [params[key]];
        params[key].push(val);
      } else {
        params[key] = val;
      }
    }
    return params;
  }

  function renderDatesFlex(params) {
    let starts = Array.isArray(params.startTime) ? params.startTime : [params.startTime];
    let ends = Array.isArray(params.endTime) ? params.endTime : [params.endTime];
    if (starts[0] && starts[0].toLowerCase && starts[0].toLowerCase() === "dates") starts.shift();
    let html = `<div class="dates-label"><i class="fa-regular fa-calendar"></i> Dates</div>`;
    html += `<div class="booking-dates-list">`;
    html += starts.map((start, i) => {
      let end = ends[i] || "";
      let dateStr = '';
      if (start) {
        dateStr = new Date(start).toLocaleString();
        if (end) {
          let endStr = new Date(end).toLocaleTimeString();
          dateStr += ` - ${endStr}`;
        }
      }
      return dateStr
        ? `<div class="date-row"><span class="date-bullet"><i class="fa-solid fa-circle"></i></span><span class="date-time">${dateStr}</span></div>`
        : '';
    }).join('');
    html += `</div>`;
    return html;
  }

  function isWeeklyBooking(params) {
    return (params.type && /weekly/i.test(params.type)) ||
           (params.eventTypeSlug && /weekly/i.test(params.eventTypeSlug));
  }

  function createBookingBox(params, isGroup = false) {
    let attendee = params.attendeeName ? decodeURIComponent(params.attendeeName.replace(/\+/g, ' ')) : '';
    let host = params.hostName ? decodeURIComponent(params.hostName.replace(/\+/g, ' ')) : '';
    let email = params.email ? decodeURIComponent(params.email) : '';
    let description = params.description ? decodeURIComponent(params.description.replace(/\+/g, ' ')) : '';
    let sessionName = params.title ? decodeURIComponent(params.title.replace(/\+/g, ' ')) : '';
    let time = params.startTime ? new Date(Array.isArray(params.startTime) ? params.startTime[0] : params.startTime).toLocaleString() : '';

    // Title logic
    let isWeekly = isWeeklyBooking(params);
    let titleIcon = isWeekly ? '<i class="fa-solid fa-repeat" style="color:#5A189A;"></i>' : '<i class="fa-solid fa-check-circle" style="color:#2E1443;"></i>';
    let title;
    if (isWeekly) {
      title = `${titleIcon} Recurring Booking Successful!`;
    } else if (sessionName.startsWith("🎉")) {
      // Preserve original title if it starts with the emoji
      title = sessionName;
      sessionName = ""; // Don't show session name twice
    } else {
      title = `${titleIcon} Booking Successful!`;
    }

    let repeatMessage = '';
    if (isWeekly && (!Array.isArray(params.startTime) || params.startTime.length === 1)) {
      let count = params.count ? parseInt(params.count, 10) : null;
      repeatMessage = `<div style="margin-top:.5em;"><b>This session is set to repeat weekly${count && count > 1 ? ` for <b>${count}</b> weeks based on your selection.` : "."}</b></div>`;
    }

    // Render the card
    return `
      <div class="booking-success-box" style="border:4px solid #2E1443; border-radius: 0.75rem; padding:1em;margin-bottom:1em;background:#F9F7FB;box-shadow:0 2px 8px #0001;">
        <div style="font-weight:bold;margin-bottom:.5em;font-size:1.2em;">${title}</div>
        ${sessionName ? `<div><strong><i class="fa-solid fa-graduation-cap"></i> Session:</strong> ${sessionName}</div>` : ""}
        ${time ? `<div><strong><i class="fa-regular fa-clock"></i> Time:</strong> ${time}</div>` : ''}
        ${attendee ? `<div><strong><i class="fa-solid fa-user"></i> Booked for:</strong> ${attendee}</div>` : ''}
        ${host ? `<div><strong><i class="fa-solid fa-chalkboard-user"></i> Host:</strong> ${host}</div>` : ''}
        ${description ? `<div><strong><i class="fa-solid fa-comment"></i> Description:</strong> ${description}</div>` : ''}
        <div style="margin-top:.5em;"><i class="fa-solid fa-envelope-open-text"></i> A booking pending email was sent to <strong>${email}</strong>.</div>
        <div style="margin-top:.25em;"><i class="fa-regular fa-clock"></i> A final confirmation email will be sent once the host confirms your session.</div>
        ${repeatMessage}
      </div>
    `;
  }

  function renderBookings() {
    let container = document.getElementById('booking-success-list');
    if (!container) return;
    let bookings = [];
    try {
      bookings = JSON.parse(sessionStorage.getItem('bookingSuccessList') || '[]');
    } catch (e) {}
    container.innerHTML = '';
    if (bookings.length === 0) {
      container.innerHTML = '<em>No recent bookings to show.</em>';
    } else {
      for (let i = 0; i < bookings.length; i++) {
        let isGroup = bookings[i].isGroup || false;
        container.innerHTML += createBookingBox(bookings[i], isGroup);
        if (i < bookings.length - 1) {
          container.innerHTML += '<hr style="border:0;border-top:1px solid #eee;">';
        }
      }
      container.innerHTML += `<button id="clear-bookings-btn" style="margin-top:.5em;background:#2E1443;color:#fff;border:none;padding:.5em 1em;border-radius:3px;cursor:pointer;"><i class="fa-solid fa-trash"></i> Clear All</button>`;
      document.getElementById('clear-bookings-btn').onclick = function () {
        sessionStorage.removeItem('bookingSuccessList');
        renderBookings();
      };
    }
  }

  function maybeStoreBooking() {
    const successPages = ['/pages/success', '/pages/subscribed'];
    const path = window.location.pathname;
    if (!successPages.includes(path)) return;
    const params = getQueryParams(window.location.href);

    const isRelevant = params.isSuccessBookingPage === 'true'
      || (params.type && (params.type.toLowerCase().includes('prepaid') || params.type.toLowerCase().includes('weekly')))
      || (params.eventTypeSlug && (params.eventTypeSlug.toLowerCase().includes('prepaid') || params.eventTypeSlug.toLowerCase().includes('weekly')));

    if (!isRelevant) return;

    let bookings = [];
    try {
      bookings = JSON.parse(sessionStorage.getItem('bookingSuccessList') || '[]');
    } catch (e) {}

    if (path === '/pages/subscribed' && Array.isArray(params.startTime) && params.startTime.length > 1) {
      if (!params.uid || !bookings.find(b => b.uid === params.uid)) {
        params.isGroup = true;
        bookings.push(params);
      }
    } else {
      if (!params.uid || !bookings.find(b => b.uid === params.uid)) {
        params.isGroup = false;
        bookings.push(params);
      }
    }
    sessionStorage.setItem('bookingSuccessList', JSON.stringify(bookings));
  }

  function ensureContainer() {
    let container = document.getElementById('booking-success-list');
    if (!container) {
      container = document.createElement('div');
      container.id = 'booking-success-list';
      let main = document.querySelector('main') || document.body;
      main.insertBefore(container, main.firstChild);
    }
  }

  function waitForPreloaderUnlock(cb) {
    if (!document.documentElement.classList.contains('preloader-lock')) {
      cb();
    } else {
      const observer = new MutationObserver(() => {
        if (!document.documentElement.classList.contains('preloader-lock')) {
          observer.disconnect();
          cb();
        }
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
  }

  // Run everything
  loadFontAwesome();
  waitForPreloaderUnlock(function () {
    ensureContainer();
    maybeStoreBooking();
    renderBookings();
  });

  // Add styles for flex date rows, centering, and the Dates underline
  const style = document.createElement('style');
  style.innerHTML = `
    .booking-success-box .dates-label {
      font-weight: bold;
      text-align: center;
      border-bottom: 1.5px solid #2E1443;
      margin: 0.5em auto 0.5em auto;
      display: block;
      padding-bottom: 3px;
      letter-spacing: .5px;
      width: 100%;
      max-width: 120px;
    }
    .booking-success-box .booking-dates-list {
      display: inline-block;
      text-align: left;
      margin: 0.5em 0 0.5em 0;
      padding: 0;
    }
    .booking-success-box .date-row {
      display: flex;
      align-items: center;
      gap: 0.5em;
      font-family: inherit;
      font-size: 1em;
    }
    .booking-success-box .date-bullet {
      display: inline-block;
      width: 1.2em;
      text-align: right;
      font-size: 1.1em;
      color: #5A189A;
    }
    .booking-success-box .date-time {
      display: inline-block;
    }
    .booking-success-box {
      text-align: center;
      font-family: inherit;
    }
    .booking-success-box i.fa-solid,
    .booking-success-box i.fa-regular {
      margin-right: 3px;
      vertical-align: middle;
    }
    .booking-success-box button#clear-bookings-btn i.fa-solid {
      margin-right: 5px;
    }
  `;
  document.head.appendChild(style);
})();