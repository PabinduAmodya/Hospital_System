const state = {
  token: localStorage.getItem('hs_token') || '',
  user: JSON.parse(localStorage.getItem('hs_user') || 'null'),
  activeModule: null,
};

const authCard = document.getElementById('auth-card');
const appSection = document.getElementById('app');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const nav = document.getElementById('module-nav');
const content = document.getElementById('module-content');
const sessionInfo = document.getElementById('session-info');

document.getElementById('logout-btn').addEventListener('click', logout);
loginForm.addEventListener('submit', onLogin);

function logout() {
  localStorage.removeItem('hs_token');
  localStorage.removeItem('hs_user');
  state.token = '';
  state.user = null;
  showAuth();
}

async function onLogin(e) {
  e.preventDefault();
  loginError.textContent = '';
  const fd = new FormData(loginForm);
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: fd.get('username'), password: fd.get('password') })
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    state.token = data.token;
    state.user = { username: data.username, role: data.role, name: data.name };
    localStorage.setItem('hs_token', state.token);
    localStorage.setItem('hs_user', JSON.stringify(state.user));
    showApp();
  } catch (err) {
    loginError.textContent = `Login failed: ${err.message}`;
  }
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
    }
  });
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) throw new Error(typeof body === 'string' ? body : JSON.stringify(body));
  return body;
}

const modules = [
  {
    id: 'users', label: 'Admin Users', roles: ['ADMIN'],
    render: () => renderCrudModule({
      title: 'Manage Users',
      fields: [
        ['name', 'Name'], ['username', 'Username'], ['password', 'Password', 'password'],
        ['role', 'Role', 'select', ['ADMIN', 'RECEPTIONIST', 'CASHIER']]
      ],
      load: () => api('/api/admin/users'),
      create: (v) => api('/api/admin/users', { method: 'POST', body: JSON.stringify(v) }),
      remove: (id) => api(`/api/admin/users/${id}`, { method: 'DELETE' }),
      columns: ['id', 'name', 'username', 'role']
    })
  },
  {
    id: 'doctors', label: 'Doctors', roles: ['ADMIN', 'RECEPTIONIST'],
    render: () => renderCrudModule({
      title: 'Doctors',
      fields: [['name','Name'],['specialization','Specialization'],['phone','Phone'],['email','Email','email'],['channeling_fee','Channeling Fee','number']],
      load: () => api('/api/doctors'),
      create: (v) => api('/api/doctors/add', { method: 'POST', body: JSON.stringify(v) }),
      columns: ['id','name','specialization','phone','email','channelling_fee']
    })
  },
  {
    id: 'schedules', label: 'Schedules', roles: ['ADMIN', 'RECEPTIONIST'],
    render: () => renderCustom('Doctor Schedules', [
      { title: 'Create Schedule', form: [['doctorId','Doctor ID','number'],['day','Day'],['startTime','Start Time'],['endTime','End Time']], submit: (v)=>api('/api/schedules/add',{method:'POST',body:JSON.stringify(v)}) },
      { title: 'Load Doctor Schedules', form: [['doctorId','Doctor ID','number']], submit: (v)=>api(`/api/schedules/${v.doctorId}`) },
      { title: 'Delete Schedule (Admin)', form: [['id','Schedule ID','number']], submit: (v)=>api(`/api/schedules/${v.id}`,{method:'DELETE'}) }
    ])
  },
  {
    id: 'patients', label: 'Patients', roles: ['ADMIN', 'RECEPTIONIST'],
    render: () => renderCrudModule({
      title: 'Patients',
      fields: [['name','Name'],['phone','Phone'],['email','Email','email'],['gender','Gender'],['dob','DOB (YYYY-MM-DD)','date']],
      load: ()=>api('/api/patients'),
      create: (v)=>api('/api/patients/register',{method:'POST',body:JSON.stringify(v)}),
      columns: ['id','name','phone','email','gender','dob']
    })
  },
  {
    id: 'appointments', label: 'Appointments', roles: ['ADMIN', 'RECEPTIONIST', 'CASHIER'],
    render: () => renderAppointmentModule()
  },
  {
    id: 'tests', label: 'Medical Tests', roles: ['ADMIN', 'RECEPTIONIST'],
    render: () => renderCustom('Medical Tests', [
      { title: 'Add Test (Admin)', form: [['testName','Test Name'],['description','Description'],['price','Price','number'],['testType','Type (BLOOD_TEST/XRAY/MRI/SCAN/URINE_TEST)']], submit:(v)=>api('/api/tests',{method:'POST',body:JSON.stringify(v)}) },
      { title: 'Load All Tests', form: [], submit:()=>api('/api/tests') },
      { title: 'Load Tests By Type', form: [['type','Type']], submit:(v)=>api(`/api/tests/type/${v.type}`) }
    ])
  },
  {
    id: 'bills', label: 'Bills', roles: ['ADMIN', 'CASHIER'],
    render: () => renderCustom('Bills', [
      { title: 'Create Bill for Appointment', form: [['appointmentId','Appointment ID','number']], submit:(v)=>api(`/api/bills/appointment/${v.appointmentId}`,{method:'POST'}) },
      { title: 'Add Test to Bill', form: [['billId','Bill ID','number'],['testId','Test ID','number']], submit:(v)=>api(`/api/bills/${v.billId}/add-test/${v.testId}`,{method:'POST'}) },
      { title: 'Load All Bills', form: [], submit:()=>api('/api/bills') }
    ])
  },
  {
    id: 'payments', label: 'Payments', roles: ['ADMIN', 'CASHIER'],
    render: () => renderCustom('Payments', [
      { title: 'Create Payment', form: [['billId','Bill ID','number'],['amountPaid','Amount Paid','number'],['paymentMethod','Method']], submit:(v)=>api('/api/payment/create',{method:'POST',body:JSON.stringify({ bill:{ id:Number(v.billId) }, amountPaid:v.amountPaid, paymentMethod:v.paymentMethod })}) },
      { title: 'Load All Payments', form: [], submit:()=>api('/api/payment/all') }
    ])
  }
];

function allowedModules() {
  return modules.filter(m => m.roles.includes(state.user?.role));
}

function showAuth() {
  authCard.classList.remove('hidden');
  appSection.classList.add('hidden');
  sessionInfo.classList.add('hidden');
}

function showApp() {
  authCard.classList.add('hidden');
  appSection.classList.remove('hidden');
  sessionInfo.classList.remove('hidden');
  sessionInfo.textContent = `${state.user.name || state.user.username} (${state.user.role})`;
  renderNav();
}

function renderNav() {
  nav.innerHTML = '';
  const mods = allowedModules();
  state.activeModule = state.activeModule && mods.find(m=>m.id===state.activeModule) ? state.activeModule : mods[0]?.id;
  mods.forEach(m => {
    const btn = document.createElement('button');
    btn.textContent = m.label;
    if (m.id === state.activeModule) btn.classList.add('active');
    btn.onclick = () => { state.activeModule = m.id; renderNav(); renderModule(); };
    nav.appendChild(btn);
  });
  renderModule();
}

function renderModule() {
  content.innerHTML = '';
  const mod = allowedModules().find(m => m.id === state.activeModule);
  if (!mod) {
    content.innerHTML = '<div class="card"><p>No modules available for this role.</p></div>';
    return;
  }
  mod.render();
}

function renderCrudModule(cfg) {
  const wrapper = document.createElement('div');
  wrapper.className = 'card';
  wrapper.innerHTML = `<h3>${cfg.title}</h3>`;

  const form = document.createElement('form');
  form.className = 'grid-form';
  cfg.fields.forEach(([name,label,type='text',options]) => {
    const l = document.createElement('label');
    l.textContent = label;
    const el = type === 'select' ? document.createElement('select') : document.createElement('input');
    el.name = name;
    if (type !== 'select') el.type = type;
    if (type === 'select') options.forEach(o => { const opt = document.createElement('option'); opt.value = o; opt.textContent = o; el.appendChild(opt); });
    l.appendChild(el); form.appendChild(l);
  });
  const submit = document.createElement('button'); submit.textContent = 'Create'; submit.type='submit'; form.appendChild(submit);
  const status = document.createElement('p'); status.className = 'status';
  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      const v = Object.fromEntries(new FormData(form).entries());
      await cfg.create(v);
      status.className = 'status success'; status.textContent = 'Created successfully';
      form.reset();
      await refresh();
    } catch (err) { status.className = 'status error'; status.textContent = err.message; }
  };
  wrapper.appendChild(form); wrapper.appendChild(status);

  const table = document.createElement('div');
  wrapper.appendChild(table);

  const refresh = async () => {
    const rows = await cfg.load();
    table.innerHTML = renderTable(cfg.columns, rows, cfg.remove ? async (id)=>{ await cfg.remove(id); await refresh(); } : null);
  };

  const loadBtn = document.createElement('button');
  loadBtn.textContent = 'Refresh';
  loadBtn.onclick = refresh;
  wrapper.appendChild(loadBtn);

  content.appendChild(wrapper);
  refresh().catch(err => status.textContent = err.message);
}

function renderCustom(title, actions) {
  const wrap = document.createElement('div');
  wrap.className = 'card';
  wrap.innerHTML = `<h3>${title}</h3>`;
  const output = document.createElement('pre'); output.className = 'compact';

  actions.forEach(act => {
    const f = document.createElement('form');
    f.className = 'grid-form';
    const head = document.createElement('h4'); head.textContent = act.title; wrap.appendChild(head);
    act.form.forEach(([name,label,type='text']) => {
      const l = document.createElement('label'); l.textContent = label;
      const i = document.createElement('input'); i.name = name; i.type = type;
      l.appendChild(i); f.appendChild(l);
    });
    const b = document.createElement('button'); b.type='submit'; b.textContent='Run'; f.appendChild(b);
    const s = document.createElement('p'); s.className='status';
    f.onsubmit = async (e)=>{ e.preventDefault(); try { const v = Object.fromEntries(new FormData(f).entries()); const data = await act.submit(v); output.textContent = JSON.stringify(data, null, 2); s.className='status success'; s.textContent='Success'; } catch(err){ s.className='status error'; s.textContent = err.message; } };
    wrap.appendChild(f); wrap.appendChild(s);
  });

  wrap.appendChild(output);
  content.appendChild(wrap);
}

function renderAppointmentModule() {
  renderCustom('Appointments', [
    { title:'Book Appointment (Admin/Receptionist)', form:[['patientId','Patient ID','number'],['scheduleId','Schedule ID','number'],['appointmentDate','Date','date'],['appointmentFee','Fee','number']], submit:(v)=>api('/api/appointments/book',{method:'POST',body:JSON.stringify(v)}) },
    { title:'Load All Appointments (Admin/Receptionist)', form:[], submit:()=>api('/api/appointments') },
    { title:'Update Status (Admin/Receptionist)', form:[['id','Appointment ID','number'],['status','Status (PENDING/CONFIRMED/COMPLETED/CANCELLED)'],['notes','Notes']], submit:(v)=>api(`/api/appointments/${v.id}/status`,{method:'PUT',body:JSON.stringify({status:v.status,notes:v.notes})}) },
    { title:'Cancel Appointment (Admin/Receptionist)', form:[['id','Appointment ID','number'],['cancellationReason','Reason'],['refundRequired','Refund Required (true/false)']], submit:(v)=>api(`/api/appointments/${v.id}/cancel`,{method:'PUT',body:JSON.stringify({cancellationReason:v.cancellationReason,refundRequired:v.refundRequired==='true'})}) },
    { title:'Mark Appointment Paid (Admin/Receptionist/Cashier)', form:[['id','Appointment ID','number'],['amount','Amount','number']], submit:(v)=>api(`/api/appointments/${v.id}/payment`,{method:'POST',body:JSON.stringify({amount:v.amount})}) },
    { title:'Reschedule Appointment (Admin/Receptionist)', form:[['id','Appointment ID','number']], submit:(v)=>api(`/api/appointments/${v.id}/reschedule`,{method:'PUT'}) },
    { title:'Find Appointments by Status (Admin/Receptionist)', form:[['status','Status']], submit:(v)=>api(`/api/appointments/status/${v.status}`) },
    { title:'Today Appointments (Admin/Receptionist)', form:[], submit:()=>api('/api/appointments/today') },
    { title:'Appointments by Patient (Admin/Receptionist)', form:[['patientId','Patient ID','number']], submit:(v)=>api(`/api/appointments/patient/${v.patientId}`) },
    { title:'Appointments by Doctor (Admin/Receptionist)', form:[['doctorId','Doctor ID','number']], submit:(v)=>api(`/api/appointments/doctor/${v.doctorId}`) }
  ]);
}

function renderTable(columns, rows, onDelete) {
  const th = columns.map(c => `<th>${c}</th>`).join('') + (onDelete ? '<th>Action</th>' : '');
  const body = rows.map(r => `<tr>${columns.map(c => `<td>${safe(r[c])}</td>`).join('')}${onDelete ? `<td><button data-delete="${r.id}">Delete</button></td>`:''}</tr>`).join('');
  const html = `<div class="table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></div>`;
  setTimeout(() => {
    if (!onDelete) return;
    document.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', async () => {
      await onDelete(btn.getAttribute('data-delete'));
    }));
  }, 0);
  return html;
}

function safe(v) { return v == null ? '' : String(v); }

if (state.token && state.user) showApp(); else showAuth();
