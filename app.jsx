



Import React, { useState, useEffect, useMemo } from ‘react’;



Import { initializeApp } from “firebase/app”;



Import { 



  getFirestore,
collection, onSnapshot, addDoc, 



  updateDoc,
deleteDoc, doc, query, orderBy, 



  setDoc, getDocs,
where



} from “firebase/firestore”;



Import { 



  getAuth,
signInAnonymously, onAuthStateChanged 



} from “firebase/auth”;



Import { 



  Users,
ClipboardList, CheckCircle2, Plus, UserPlus, Search, 



  Stethoscope, Bed,
Trash2, Download, MapPin, UserCheck,



  Settings, Lock,
Unlock, ShieldCheck, Clock, User, 



  AlertTriangle,
ChevronDown, Save, UserMinus, ChevronRight



} from ‘lucide-react’;



 



// --- CONFIGURATION ---



 



  Const firebaseConfig
= {



    apiKey:
“AIzaSyDkd10IFfYPWSMFDGXvXZfI5NAdfYbP1W8”,



    authDomain:
“gm-3-patient-task-manager.firebaseapp.com”,



    projectId:
“gm-3-patient-task-manager”,



    storageBucket:
“gm-3-patient-task-manager.firebasestorage.app”,



    messagingSenderId:
“900309403031”,



    appId:
“1:900309403031:web:af893265f29c03039930d2”,



    measurementId:
“G-FNHHWDDJ26”



  };



 



  // Initialize
Firebase



  Const app =
initializeApp(firebaseConfig);



  Const analytics =
getAnalytics(app);



</script>



  



};



 



// Initialize Firebase



Const app = initializeApp(firebaseConfig);



Const db = getFirestore(app);



Const auth = getAuth(app);



Const appId = “med-unit-001”; // Unique ID for your unit



 



Export default function App() {



  Const [user,
setUser] = useState(null);



  Const [view,
setView] = useState(‘tasks’);



  Const [tasks,
setTasks] = useState([]);



  Const [patients,
setPatients] = useState([]);



  Const [residents,
setResidents] = useState([]);



  Const [consultants,
setConsultants] = useState([]);



  



  // Identity &
Admin States



  Const [currentUser,
setCurrentUser] = useState({ id: ‘guest’, name: “Select Identity”, type: ‘none’
});



  Const
[showUserSelector, setShowUserSelector] = useState(false);



  Const [isAdmin,
setIsAdmin] = useState(false);



  Const
[showAdminLogin, setShowAdminLogin] = useState(false);



  Const
[adminPassInput, setAdminPassInput] = useState(‘’);



  Const
[confirmingTask, setConfirmingTask] = useState({ id: null, step: 0 });



  Const [deniedTaskId,
setDeniedTaskId] = useState(null);



  Const [isAddingTask,
setIsAddingTask] = useState(false);



  Const
[isAddingPatient, setIsAddingPatient] = useState(false);



  Const
[isEditingTeam, setIsEditingTeam] = useState(false);



  Const [searchQuery,
setSearchQuery] = useState(‘’);



 



  // Form States



  Const [newTask,
setNewTask] = useState({ patientId: ‘’, title: ‘’, assignedTo: ‘’, priority:
‘medium’ });



  Const [newPatient,
setNewPatient] = useState({ name: ‘’, bed: ‘’, ward: ‘’, diagnosis: ‘’,
consultant: ‘’ });



 



  // 1. Authentication
& Initial Sync



  useEffect(() => {



   
signInAnonymously(auth).catch(err => console.error(“Auth error:”,
err));



   
onAuthStateChanged(auth, (u) => setUser(u));



 



    const qTasks =
query(collection(db, ‘artifacts’, appId, ‘public’, ‘data’, ‘tasks’),
orderBy(‘createdAt’, ‘desc’));



    const unsubTasks =
onSnapshot(qTasks, (snap) => {



     
setTasks(snap.docs.map(d => ({ ...d.data(), id: d.id })));



    });



 



    Const
unsubPatients = onSnapshot(collection(db, ‘artifacts’, appId, ‘public’, ‘data’,
‘patients’), (snap) => {



     
setPatients(snap.docs.map(d => ({ ...d.data(), id: d.id })));



    });



 



    Const unsubStaff =
onSnapshot(collection(db, ‘artifacts’, appId, ‘public’, ‘data’, ‘staff’),
(snap) => {



      Const staffData
= snap.docs.map(d => ({ ...d.data(), id: d.id }));



     
setResidents(staffData.filter(s => s.type === ‘resident’));



     
setConsultants(staffData.filter(s => s.type === ‘consultant’));



    });



 



    Return () => {
unsubTasks(); unsubPatients(); unsubStaff(); };



  }, []);



 



  // 2. Logic: Task
Expiry (24 hours)



  Const visibleTasks =
useMemo(() => {



    Const now = new
Date();



    Return
tasks.filter(task => {



      If (task.status
!== ‘completed’ || !task.completedAt) return true;



      Const diff =
(now – new Date(task.completedAt)) / (1000 * 60 * 60);



      Return diff <
24;



    }).filter(t =>
t.title.toLowerCase().includes(searchQuery.toLowerCase()));



  }, [tasks,
searchQuery]);



 



  // 3. Actions



  Const handleAddTask
= async (e) => {



   
e.preventDefault();



    if
(!newTask.patientId || !newTask.title) return;



    await
addDoc(collection(db, ‘artifacts’, appId, ‘public’, ‘data’, ‘tasks’), {



      ...newTask,



      Status:
‘pending’,



      createdAt: new
Date().toISOString()



    });



   
setIsAddingTask(false);



    setNewTask({
patientId: ‘’, title: ‘’, assignedTo: ‘’, priority: ‘medium’ });



  };



 



  Const
handleAddPatient = async (e) => {



   
e.preventDefault();



    await
addDoc(collection(db, ‘artifacts’, appId, ‘public’, ‘data’, ‘patients’),
newPatient);



    setIsAddingPatient(false);



  };



 



  Const handleTaskStep
= async (task) => {



    Const patient =
patients.find(p => p.id === task.patientId);



    Const canComplete
= currentUser.id === task.assignedTo || currentUser.name ===
patient?.consultant;



    



    If (!canComplete)
{



     
setDeniedTaskId(task.id);



      setTimeout(()
=> setDeniedTaskId(null), 2500);



      return;



    }



 



    If
(confirmingTask.id !== task.id) {



     
setConfirmingTask({ id: task.id, step: 1 });



    } else if
(confirmingTask.step === 1) {



     
setConfirmingTask({ id: task.id, step: 2 });



    } else {



      Await
updateDoc(doc(db, ‘artifacts’, appId, ‘public’, ‘data’, ‘tasks’, task.id), {



        Status:
‘completed’,



        completedAt:
new Date().toISOString()



      });



     
setConfirmingTask({ id: null, step: 0 });



    }



  };



 



  Const
handleAdminLogin = (e) => {



   
e.preventDefault();



    if (adminPassInput
=== “admin123”) {



     
setIsAdmin(true);



     
setShowAdminLogin(false);



     
setAdminPassInput(‘’);



    } else {
alert(“Wrong PIN”); }



  };



 



  Const addStaff =
async (type) => {



    Const name =
prompt(`Enter ${type} name:`);



    If (!name) return;



    Await
addDoc(collection(db, ‘artifacts’, appId, ‘public’, ‘data’, ‘staff’), {



      Name, type,
role: type === ‘resident’ ? ‘JR1’ : ‘Consultant’



    });



  };



 



  Const deleteStaff =
async (id) => {



    If
(window.confirm(“Remove this member?”)) {



      Await
deleteDoc(doc(db, ‘artifacts’, appId, ‘public’, ‘data’, ‘staff’, id));



    }



  };



 



  Const getPatientInfo
= (id) => patients.find(p => p.id === id) || {};



 



  Return (



    <div
className=”min-h-screen bg-slate-50 text-slate-900 font-sans pb-24”>



      {/* Header */}



      <header
className=”bg-blue-900 text-white p-4 shadow-lg sticky top-0 z-50”>



        <div
className=”max-w-4xl mx-auto flex justify-between items-center”>



          <div
className=”flex items-center gap-2”>



           
<Stethoscope size={24} className=”text-blue-300” />



            <h1
className=”font-bold text-lg hidden sm:block”>Unit Manager</h1>



          </div>



 



          <div
className=”flex items-center gap-2”>



            <div
className=”relative”>



             
<button 



               
onClick={() => setShowUserSelector(!showUserSelector)}



               
className=”bg-white/10 px-3 py-2 rounded-xl flex items-center gap-2
text-xs font-bold border border-white/10”



              >



               
<User size={14} /> {currentUser.name} <ChevronDown size={12}
/>



             
</button>



             
{showUserSelector && (



               
<div className=”absolute right-0 mt-2 w-56 bg-white rounded-2xl
shadow-2xl border border-slate-200 overflow-hidden text-slate-800 z-[60]”>



                 
<div className=”p-2 bg-slate-50 text-[10px] font-black
text-slate-400”>SELECT IDENTITY</div>



                 
<div className=”max-h-64 overflow-y-auto”>



                   
{consultants.map(c => (



                     
<button key={c.id} onClick={() => { setCurrentUser({ id: c.id,
name: c.name, type: ‘consultant’ }); setShowUserSelector(false); }}
className=”w-full text-left p-3 text-xs hover:bg-blue-50 flex items-center
gap-2 border-b border-slate-50”><UserCheck size={14}/>
{c.name}</button>



                   
))}



                   
{residents.map(r => (



                     
<button key={r.id} onClick={() => { setCurrentUser({ id: r.id,
name: r.name, type: ‘resident’ }); setShowUserSelector(false); }}
className=”w-full text-left p-3 text-xs hover:bg-blue-50 flex items-center
gap-2 border-b border-slate-50”><Users size={14}/>
{r.name}</button>



                   
))}



                 
</div>



               
</div>



              )}



           
</div>



            <button
onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)}
className={`p-2 rounded-xl ${isAdmin ? ‘bg-green-600’ : ‘bg-white/10’}`}>



              {isAdmin
? <Unlock size={18}/> : <Lock size={18}/>}



           
</button>



          </div>



        </div>



      </header>



 



      <main
className=”max-w-4xl mx-auto p-4”>



        {/* Nav Tabs
*/}



        <div className=”flex
bg-white rounded-2xl shadow-sm border border-slate-200 p-1 mb-6”>



          {[‘tasks’,
‘patients’, ‘team’].map(t => (



            <button
key={t} onClick={() => setView(t)} className={`flex-1 py-3 rounded-xl
text-sm font-bold flex items-center justify-center gap-2 transition-all ${view
=== t ? ‘bg-blue-50 text-blue-700’ : ‘text-slate-400’}`}>



              {t ===
‘tasks’ ? <ClipboardList size={18}/> : t === ‘patients’ ? <Bed
size={18}/> : <Users size={18}/>}



              <span
className=”capitalize”>{t}</span>



           
</button>



          ))}



        </div>



 



        {view ===
‘tasks’ && (



          <section
className=”space-y-3”>



             <div
className=”flex gap-2 mb-4”>



              <div
className=”relative flex-1”>



               
<Search className=”absolute left-3 top-1/2 -translate-y-1/2
text-slate-400” size={18} />



               
<input type=”text” placeholder=”Search orders...” className=”w-full
pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none”
value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />



             
</div>



             
<button onClick={() => setIsAddingTask(true)}
className=”bg-blue-800 text-white p-3 rounded-xl shadow-lg”><Plus
size={24}/></button>



           
</div>



 



           
{visibleTasks.map(task => {



              Const p
= getPatientInfo(task.patientId);



              Const
isCompleted = task.status === ‘completed’;



              Const
isDenied = deniedTaskId === task.id;



              Const
isConfirming = confirmingTask.id === task.id;



 



              Return (



               
<div key={task.id} className={`bg-white border rounded-3xl p-4
shadow-sm transition-all ${isCompleted ? ‘grayscale opacity-40’ :
‘border-slate-200 hover:border-blue-300’}`}>



                 
<div className=”flex items-start gap-4”>



                   
{!isCompleted ? (



                     
<button 



                       
onClick={() => handleTaskStep(task)}



                       
className={`min-w-[70px] py-2 px-1 rounded-2xl border-2 font-black
text-[10px] uppercase flex flex-col items-center justify-center transition-all
${



                         
isDenied ? ‘bg-red-50 border-red-500 text-red-600’ :



                         
isConfirming ? (confirmingTask.step === 1 ? ‘bg-orange-50
border-orange-400 text-orange-600’ : ‘bg-red-100 border-red-600 text-red-600
animate-pulse’) :



                         
‘bg-slate-50 border-slate-100 text-slate-400 hover:text-blue-600’



                       
}`}



                     
>



                       
{isDenied ? ‘Denied’ : isConfirming ? (confirmingTask.step === 1 ?
‘Confirm?’ : ‘Finalize?’) : ‘Done?’}



                     
</button>



                    )
: (



                     
<div className=”min-w-[70px] py-2 flex flex-col items-center
text-green-600”><CheckCircle2 size={24}/><span
className=”text-[10px] font-black”>Done</span></div>



                    )}



                   
<div className=”flex-1”>



                     
<div className=”flex items-center gap-2 mb-1”>



                       
<span className={`text-[9px] font-black px-2 py-0.5 rounded-full
${task.priority === ‘high’ ? ‘bg-red-100 text-red-600’ : ‘bg-slate-100
text-slate-500’}`}>{task.priority.toUpperCase()}</span>



                       
<span className=”text-xs font-bold text-blue-800”>Bed {p.bed} •
{p.ward}</span>



                     
</div>



                     
<h3 className={`text-base font-bold ${isCompleted ? ‘line-through
text-slate-400’ : ‘text-slate-800’}`}>{task.title}</h3>



                     
<div className=”flex justify-between items-center mt-2 text-[11px]
font-medium text-slate-500”>



                       
<span>{p.name} ({p.consultant})</span>



                       
<span className=”text-blue-700 font-bold”>{residents.find(r =>
r.id === task.assignedTo)?.name || ‘Unassigned’}</span>



                     
</div>



                     
{isDenied && <p className=”text-[9px] text-red-600 font-black
uppercase mt-1”>Permission Denied: Unauthorized staff.</p>}



                   
</div>



                   
{isAdmin && <button onClick={() => deleteTask(task.id)}
className=”text-slate-200 hover:text-red-500”><Trash2
size={16}/></button>}



                 
</div>



               
</div>



              );



            })}



         
</section>



        )}



 



        {view ===
‘patients’ && (



          <section
className=”space-y-6”>



            <div
className=”flex justify-between items-center”>



              <h2
className=”font-bold text-lg”>Census</h2>



             
<button onClick={() => setIsAddingPatient(true)}
className=”bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold
shadow-md”>+ Add Patient</button>



           
</div>



           
{consultants.map(c => (



              <div
key={c.id} className=”space-y-3”>



                <h3
className=”text-sm font-bold text-slate-400 flex items-center gap-2 border-b
pb-2”><UserCheck size={16}/> {c.name}</h3>



               
<div className=”grid grid-cols-1 sm:grid-cols-2 gap-4”>



                 
{patients.filter(p => p.consultant === c.name).map(p => (



                   
<div key={p.id} className=”bg-white p-4 rounded-3xl border
border-slate-200 shadow-sm flex items-center gap-4”>



                     
<div className=”w-12 h-12 bg-blue-50 text-blue-800 rounded-2xl flex
items-center justify-center font-black”>B-{p.bed}</div>



                     
<div>



                       
<p className=”font-bold text-slate-800”>{p.name}</p>



                       
<p className=”text-[11px] text-slate-500”>{p.ward} •
{p.diagnosis}</p>



                     
</div>



                   
</div>



                  ))}



               
</div>



             
</div>



            ))}



         
</section>



        )}



 



        {view ===
‘team’ && (



          <section
className=”space-y-6”>



            <div
className=”flex justify-between items-center”>



              <h2
className=”font-bold text-lg”>Unit Directory</h2>



              {isAdmin
&& (



               
<button onClick={() => setIsEditingTeam(!isEditingTeam)}
className={`px-4 py-2 rounded-xl text-xs font-bold ${isEditingTeam ?
‘bg-green-100 text-green-700’ : ‘bg-slate-200’}`}>



                 
{isEditingTeam ? ‘Done Editing’ : ‘Manage Staff’}



               
</button>



              )}



           
</div>



            <div
className=”space-y-4”>



              <div
className=”bg-white rounded-3xl border border-slate-200 overflow-hidden
divide-y”>



               
{consultants.map(c => (



                 
<div key={c.id} className=”p-4 flex justify-between items-center”>



                   
<span className=”font-bold text-slate-800”>{c.name}
(Consultant)</span>



                   
{isEditingTeam && <button onClick={() =>
deleteStaff(c.id)} className=”text-red-400”><Trash2
size={16}/></button>}



                 
</div>



                ))}



               
{residents.map(r => (



                 
<div key={r.id} className=”p-4 flex justify-between items-center”>



                   
<span className=”font-bold text-slate-800”>{r.name}
({r.role})</span>



                   
{isEditingTeam && <button onClick={() =>
deleteStaff(r.id)} className=”text-red-400”><Trash2
size={16}/></button>}



                 
</div>



                ))}



             
</div>



             
{isEditingTeam && (



               
<div className=”flex gap-2”>



                 
<button onClick={() => addStaff(‘consultant’)} className=”flex-1
py-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-2xl font-bold
text-xs”>+ Consultant</button>



                 
<button onClick={() => addStaff(‘resident’)} className=”flex-1
py-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-2xl font-bold
text-xs”>+ Resident</button>



               
</div>



              )}



           
</div>



         
</section>



        )}



      </main>



 



      {/* MODALS */}



      {showAdminLogin
&& (



        <div
className=”fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex
items-center justify-center p-4”>



          <div
className=”bg-white w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl”>



            <h3
className=”text-xl font-black mb-4”>Admin Mode</h3>



            <input
type=”password” placeholder=”PIN” className=”w-full p-4 bg-slate-50 border
rounded-2xl text-center text-2xl font-bold outline-none mb-4”
value={adminPassInput} onChange={e => setAdminPassInput(e.target.value)}
autoFocus />



            <button
onClick={handleAdminLogin} className=”w-full py-4 bg-blue-900 text-white
rounded-2xl font-bold”>Authenticate</button>



            <button
onClick={() => setShowAdminLogin(false)} className=”mt-4 text-xs font-bold
text-slate-400 uppercase”>Cancel</button>



          </div>



        </div>



      )}



 



      {isAddingTask
&& (



        <div
className=”fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex
items-end sm:items-center justify-center p-0 sm:p-4 animate-in
slide-in-from-bottom”>



          <div
className=”bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6
shadow-2xl”>



            <h3
className=”text-xl font-bold mb-6”>New Order</h3>



            <form
onSubmit={handleAddTask} className=”space-y-4”>



             
<select className=”w-full p-4 bg-slate-50 border rounded-2xl
font-bold outline-none” required value={newTask.patientId} onChange={e =>
setNewTask({...newTask, patientId: e.target.value})}>



               
<option value=””>Choose Patient...</option>



               
{patients.map(p => <option key={p.id} value={p.id}>Bed {p.bed}:
{p.name}</option>)}



             
</select>



             
<input type=”text” placeholder=”Order details (e.g. USG Neck)”
className=”w-full p-4 bg-slate-50 border rounded-2xl outline-none” required
value={newTask.title} onChange={e => setNewTask({...newTask, title:
e.target.value})} />



             
<select className=”w-full p-4 bg-slate-50 border rounded-2xl
font-bold outline-none” value={newTask.assignedTo} onChange={e =>
setNewTask({...newTask, assignedTo: e.target.value})}>



               
<option value=””>Assign Resident...</option>



               
{residents.map(r => <option key={r.id}
value={r.id}>{r.name}</option>)}



             
</select>



             
<button type=”submit” className=”w-full py-5 bg-blue-900 text-white
rounded-2xl font-black uppercase tracking-widest shadow-xl”>Delegate
Order</button>



             
<button type=”button” onClick={() => setIsAddingTask(false)}
className=”w-full text-xs font-bold text-slate-400 uppercase
mt-4”>Cancel</button>



           
</form>



          </div>



        </div>



      )}



 



      {isAddingPatient
&& (



        <div
className=”fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-sm flex
items-end sm:items-center justify-center p-0 sm:p-4 animate-in
slide-in-from-bottom”>



          <div
className=”bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6
shadow-2xl”>



            <h3
className=”text-xl font-bold mb-6”>Register Patient</h3>



            <form
onSubmit={handleAddPatient} className=”space-y-4”>



              <div
className=”flex gap-4”>



               
<input placeholder=”Bed #” className=”flex-1 p-4 bg-slate-50 border
rounded-2xl font-bold outline-none” required value={newPatient.bed} onChange={e
=> setNewPatient({...newPatient, bed: e.target.value})} />



               
<input placeholder=”Ward” className=”flex-1 p-4 bg-slate-50 border
rounded-2xl outline-none” required value={newPatient.ward} onChange={e =>
setNewPatient({...newPatient, ward: e.target.value})} />



             
</div>



             
<input placeholder=”Patient Name” className=”w-full p-4 bg-slate-50
border rounded-2xl outline-none” required value={newPatient.name} onChange={e
=> setNewPatient({...newPatient, name: e.target.value})} />



             
<select className=”w-full p-4 bg-slate-50 border rounded-2xl
font-bold outline-none” required value={newPatient.consultant} onChange={e
=> setNewPatient({...newPatient, consultant: e.target.value})}>



               
<option value=””>Consultant In-Charge...</option>



               
{consultants.map(c => <option key={c.name}
value={c.name}>{c.name}</option>)}



             
</select>



             
<input placeholder=”Diagnosis” className=”w-full p-4 bg-slate-50
border rounded-2xl outline-none” value={newPatient.diagnosis} onChange={e =>
setNewPatient({...newPatient, diagnosis: e.target.value})} />



             
<button type=”submit” className=”w-full py-5 bg-blue-900 text-white
rounded-2xl font-black uppercase tracking-widest shadow-xl”>Register
Patient</button>



             
<button type=”button” onClick={() => setIsAddingPatient(false)}
className=”w-full text-xs font-bold text-slate-400 uppercase
mt-4”>Cancel</button>



           
</form>



          </div>



        </div>



      )}



 



      {/* MOBILE NAV
*/}



      <nav
className=”fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex
justify-around sm:hidden z-50”>



        <button
onClick={() => setView(‘tasks’)} className={`flex flex-col items-center
gap-1 ${view === ‘tasks’ ? ‘text-blue-900’ :
‘text-slate-400’}`}><ClipboardList size={22} /><span className=”text-[10px]
font-bold”>Tasks</span></button>



        <button
onClick={() => setView(‘patients’)} className={`flex flex-col items-center
gap-1 ${view === ‘patients’ ? ‘text-blue-900’ : ‘text-slate-400’}`}><Bed
size={22} /><span className=”text-[10px]
font-bold”>Patients</span></button>



        <button
onClick={() => setView(‘team’)} className={`flex flex-col items-center gap-1
${view === ‘team’ ? ‘text-blue-900’ : ‘text-slate-400’}`}><Users
size={22} /><span className=”text-[10px]
font-bold”>Team</span></button>



      </nav>



    </div>



  );



}



 



 



 



