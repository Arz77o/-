import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ملاحظة مهمة: تعمّدنا عدم استخدام <StrictMode> هنا.
// كانت هذه بالضبط سبب تكرار أحداث AddToCart/Purchase على الموقع
// القديم (كل حدث يُطلق مرتين لكل فعل واحد). فوائد StrictMode
// تخص التطوير فقط، ولا تستحق مخاطرة تضخيم بيانات Meta في production.
createRoot(document.getElementById('root')!).render(<App />);
