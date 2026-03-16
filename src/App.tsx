import React, { useState, useEffect, Component, ReactNode } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useNavigate,
  useLocation
} from 'react-router-dom';
import { 
  ShoppingCart, 
  User, 
  PlusCircle, 
  Search, 
  Menu, 
  X, 
  Smartphone, 
  Laptop, 
  Tablet,
  LogOut,
  ShieldCheck,
  Package,
  ArrowRight,
  Star,
  CheckCircle2,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  doc, 
  getDoc, 
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { Product, UserListing, CartItem, Order, UserProfile } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Error Handling ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // We don't necessarily want to crash the whole app for a background listener error
  // but we should log it clearly.
}

// --- Components ---

const Navbar = ({ 
  user, 
  cartCount, 
  onLogin, 
  onLogout 
}: { 
  user: UserProfile | null, 
  cartCount: number, 
  onLogin: () => void, 
  onLogout: () => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Shop', path: '/shop' },
    { name: 'Sell', path: '/sell' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              DenwaGadjetKu
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link 
                key={link.name} 
                to={link.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-emerald-600",
                  location.pathname === link.path ? "text-emerald-600" : "text-gray-600"
                )}
              >
                {link.name}
              </Link>
            ))}
            
            <div className="flex items-center space-x-4 border-l pl-8 border-gray-100">
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-emerald-600 transition-colors">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
              
              {user ? (
                <div className="flex items-center space-x-4">
                  {user.role === 'admin' && (
                    <Link to="/admin" className="p-2 text-gray-600 hover:text-emerald-600 transition-colors">
                      <ShieldCheck size={20} />
                    </Link>
                  )}
                  <button 
                    onClick={onLogout}
                    className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={onLogin}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                >
                  <User size={18} />
                  <span>Login</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-4">
            <Link to="/cart" className="relative p-2 text-gray-600">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 p-2">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-emerald-600 hover:bg-gray-50 rounded-lg"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-100">
                {user ? (
                  <>
                    {user.role === 'admin' && (
                      <Link 
                        to="/admin" 
                        onClick={() => setIsOpen(false)}
                        className="flex items-center space-x-2 px-3 py-2 text-base font-medium text-gray-600 hover:text-emerald-600"
                      >
                        <ShieldCheck size={20} />
                        <span>Admin Panel</span>
                      </Link>
                    )}
                    <button 
                      onClick={() => { onLogout(); setIsOpen(false); }}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-base font-medium text-gray-600 hover:text-red-600"
                    >
                      <LogOut size={20} />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => { onLogin(); setIsOpen(false); }}
                    className="flex items-center space-x-2 w-full px-3 py-2 text-base font-medium text-emerald-600"
                  >
                    <User size={20} />
                    <span>Login with Google</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// --- Pages ---

const Home = ({ products }: { products: Product[] }) => {
  const featured = products.slice(0, 4);

  return (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden bg-slate-900">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=2000" 
            alt="Hero background" 
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-bold tracking-wider text-emerald-400 uppercase bg-emerald-400/10 rounded-full border border-emerald-400/20">
              The Future of Gadgets
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
              Upgrade Your <br />
              <span className="text-emerald-500">Digital Lifestyle.</span>
            </h1>
            <p className="text-lg text-slate-300 mb-10 max-w-lg leading-relaxed">
              Discover premium new and refurbished gadgets. Buy with confidence, sell with ease. Join the ultimate gadget marketplace today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/shop" className="px-8 py-4 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all transform hover:scale-105 flex items-center justify-center space-x-2">
                <span>Explore Shop</span>
                <ArrowRight size={20} />
              </Link>
              <Link to="/sell" className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full font-bold hover:bg-white/20 transition-all flex items-center justify-center">
                Sell Your Device
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Shop by Category</h2>
              <p className="text-gray-500">Find exactly what you need from our curated collections.</p>
            </div>
            <Link to="/shop" className="text-emerald-600 font-semibold flex items-center space-x-1 hover:underline">
              <span>View all products</span>
              <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Smartphones', icon: <Smartphone size={32} />, color: 'bg-blue-50 text-blue-600', count: '120+ Items' },
              { name: 'Laptops', icon: <Laptop size={32} />, color: 'bg-purple-50 text-purple-600', count: '80+ Items' },
              { name: 'Tablets', icon: <Tablet size={32} />, color: 'bg-orange-50 text-orange-600', count: '45+ Items' },
            ].map((cat) => (
              <motion.div 
                key={cat.name}
                whileHover={{ y: -5 }}
                className="group relative p-8 rounded-3xl border border-gray-100 hover:border-emerald-100 hover:shadow-xl hover:shadow-emerald-500/5 transition-all cursor-pointer"
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", cat.color)}>
                  {cat.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{cat.name}</h3>
                <p className="text-sm text-gray-500">{cat.count}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Deals</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Handpicked gadgets at unbeatable prices. From flagship smartphones to high-performance laptops.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Verified Quality</h3>
              <p className="text-gray-500">Every refurbished device undergoes a rigorous 50-point inspection.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Secure Payments</h3>
              <p className="text-gray-500">Your transactions are protected with industry-standard encryption.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <Package size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Fast Shipping</h3>
              <p className="text-gray-500">Get your beloved gadgets delivered to your doorstep in 2-3 business days.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ProductCard = (props: { product: Product, key?: string }) => {
  const { product } = props;
  const navigate = useNavigate();
  
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="bg-white rounded-3xl border border-gray-100 overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/10 transition-all flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <span className={cn(
            "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full",
            product.condition === 'new' ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
          )}>
            {product.condition}
          </span>
        </div>
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-medium text-emerald-600 uppercase tracking-wide">{product.category}</span>
          <div className="flex items-center text-amber-400">
            <Star size={12} fill="currentColor" />
            <span className="text-xs font-bold ml-1 text-gray-600">4.8</span>
          </div>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">{product.description}</p>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xl font-extrabold text-gray-900">${product.price}</span>
          <button 
            onClick={() => navigate(`/product/${product.id}`)}
            className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors"
          >
            <PlusCircle size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Shop = ({ products }: { products: Product[] }) => {
  const [filter, setFilter] = useState<'all' | 'smartphone' | 'tablet' | 'laptop'>('all');
  const [search, setSearch] = useState('');

  const filtered = products.filter(p => 
    (filter === 'all' || p.category === filter) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Shop Gadgets</h1>
          <p className="text-gray-500">Browse our collection of premium devices.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search gadgets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full sm:w-64"
            />
          </div>
          <div className="flex bg-gray-100 p-1 rounded-full">
            {['all', 'smartphone', 'laptop', 'tablet'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all",
                  filter === f ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search size={40} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No gadgets found</h3>
          <p className="text-gray-500">Try adjusting your search or filter to find what you're looking for.</p>
        </div>
      )}
    </div>
  );
};

const ProductDetail = ({ 
  products, 
  onAddToCart 
}: { 
  products: Product[], 
  onAddToCart: (p: Product, q: number) => void 
}) => {
  const { id } = useLocation().pathname.split('/').slice(-1)[0] ? { id: useLocation().pathname.split('/').slice(-1)[0] } : { id: '' };
  const product = products.find(p => p.id === id);
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  if (!product) return <div className="pt-32 text-center">Product not found</div>;

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-3xl overflow-hidden bg-gray-100 aspect-square"
        >
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <div className="mb-8">
            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full uppercase tracking-wider mb-4">
              {product.condition} • {product.category}
            </span>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-3xl font-extrabold text-gray-900">${product.price}</span>
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} fill={i < 4 ? "currentColor" : "none"} />)}
                <span className="ml-2 text-sm font-bold text-gray-600">4.8 (120 reviews)</span>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed mb-8">{product.description}</p>
          </div>

          <div className="space-y-6 mb-10">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-bold text-gray-900">Quantity</span>
              <div className="flex items-center border border-gray-200 rounded-full p-1">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  -
                </button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-gray-400">{product.stock} units available</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => {
                onAddToCart(product, quantity);
                navigate('/cart');
              }}
              className="flex-1 py-4 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2"
            >
              <ShoppingCart size={20} />
              <span>Add to Cart</span>
            </button>
            <button className="flex-1 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-black transition-all">
              Buy Now
            </button>
          </div>

          <div className="mt-12 pt-12 border-t border-gray-100 grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Specifications</h4>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>Processor: High-end Octa-core</li>
                <li>RAM: 8GB LPDDR5</li>
                <li>Storage: 256GB NVMe</li>
                <li>Display: 6.7" AMOLED 120Hz</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Warranty</h4>
              <p className="text-sm text-gray-500">12 Months official warranty for new units. 6 Months store warranty for refurbished units.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const SellGadget = ({ user }: { user: UserProfile | null }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'smartphone',
    condition: 'second-hand',
    expectedPrice: '',
    imageUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64 in Firestore
        alert('Image size too large. Please upload an image smaller than 1MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData({ ...formData, imageUrl: base64String });
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert('Please login to sell gadgets');
    if (!formData.imageUrl) return alert('Please upload an image of your gadget');
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'userListings'), {
        ...formData,
        expectedPrice: Number(formData.expectedPrice),
        sellerId: user.uid,
        sellerEmail: user.email,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => navigate('/shop'), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to submit listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="pt-32 pb-20 max-w-xl mx-auto px-4 text-center">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <User size={40} />
        </div>
        <h1 className="text-3xl font-bold mb-4">Login to Sell</h1>
        <p className="text-gray-500 mb-8">You need to be logged in to list your gadgets for sale on our platform.</p>
        <button className="px-8 py-3 bg-emerald-600 text-white rounded-full font-bold">Login with Google</button>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-12 shadow-xl shadow-gray-200/50">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sell Your Gadget</h1>
          <p className="text-gray-500">Fill in the details below. Our team will review and approve your listing.</p>
        </div>

        {success ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Listing Submitted!</h2>
            <p className="text-gray-500">Your gadget is now pending admin approval. You'll be notified once it's live.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Gadget Name</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. iPhone 13 Pro Max"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Category</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as any})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="smartphone">Smartphone</option>
                  <option value="laptop">Laptop</option>
                  <option value="tablet">Tablet</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Description</label>
              <textarea 
                required
                rows={4}
                placeholder="Describe the condition, specs, and any defects..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Condition</label>
                <select 
                  value={formData.condition}
                  onChange={e => setFormData({...formData, condition: e.target.value as any})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="second-hand">Second Hand</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Expected Price ($)</label>
                <input 
                  required
                  type="number" 
                  placeholder="0.00"
                  value={formData.expectedPrice}
                  onChange={e => setFormData({...formData, expectedPrice: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Gadget Image (Required)</label>
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-gray-300 flex flex-col items-center">
                      <ShoppingCart size={24} />
                      <span className="text-[10px] mt-1">No Image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="gadget-image"
                  />
                  <label 
                    htmlFor="gadget-image"
                    className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-bold cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    Choose Image
                  </label>
                  <p className="text-[10px] text-gray-400 mt-2">Max size: 1MB. This image will be shown to potential buyers.</p>
                </div>
              </div>
            </div>

            <button 
              disabled={submitting}
              type="submit"
              className="w-full py-4 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const Cart = ({ 
  items, 
  onUpdateQuantity, 
  onRemove,
  onCheckout
}: { 
  items: CartItem[], 
  onUpdateQuantity: (id: string, q: number) => void,
  onRemove: (id: string) => void,
  onCheckout: () => void
}) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 15 : 0;
  const total = subtotal + shipping;

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-12">Your Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          {items.length > 0 ? (
            items.map((item) => (
              <div key={item.id} className="flex items-center space-x-6 p-6 bg-white rounded-3xl border border-gray-100">
                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{item.category} • {item.condition}</p>
                  <div className="flex items-center mt-4 space-x-4">
                    <div className="flex items-center border border-gray-200 rounded-full px-2 py-1">
                      <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center">-</button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center">+</button>
                    </div>
                    <button onClick={() => onRemove(item.id)} className="text-xs font-bold text-red-500 hover:underline">Remove</button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">${item.price} each</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <Link to="/shop" className="text-emerald-600 font-bold mt-2 inline-block">Start Shopping</Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 sticky top-24 shadow-xl shadow-gray-200/50">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>${shipping.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-gray-100 flex justify-between text-xl font-bold text-gray-900">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button 
              disabled={items.length === 0}
              onClick={onCheckout}
              className="w-full py-4 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-700 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <CreditCard size={20} />
              <span>Checkout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminPanel = ({ 
  user,
  products,
  listings,
  orders,
  onApproveListing,
  onRejectListing,
  onAddProduct,
  onDeleteProduct
}: { 
  user: UserProfile | null,
  products: Product[],
  listings: UserListing[],
  orders: Order[],
  onApproveListing: (id: string) => void,
  onRejectListing: (id: string) => void,
  onAddProduct: (p: any) => void,
  onDeleteProduct: (id: string) => void
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'listings' | 'orders'>('inventory');

  const seedData = () => {
    const initialProducts = [
      {
        name: 'iPhone 15 Pro',
        description: 'Titanium design, A17 Pro chip, and the most powerful iPhone camera system ever.',
        price: 999,
        category: 'smartphone',
        condition: 'new',
        stock: 15,
        imageUrl: 'https://images.unsplash.com/photo-1696446701796-da61225697cc?auto=format&fit=crop&q=80&w=800'
      },
      {
        name: 'MacBook Air M3',
        description: 'Supercharged by M3. The world’s most popular laptop is better than ever.',
        price: 1099,
        category: 'laptop',
        condition: 'new',
        stock: 10,
        imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800'
      },
      {
        name: 'iPad Pro 12.9"',
        description: 'Astonishing performance. Incredibly advanced displays. Superfast wireless connectivity.',
        price: 799,
        category: 'tablet',
        condition: 'refurbished',
        stock: 8,
        imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=800'
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'The ultimate Galaxy Ultra experience. Now with Galaxy AI.',
        price: 1299,
        category: 'smartphone',
        condition: 'new',
        stock: 12,
        imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=800'
      }
    ];
    initialProducts.forEach(p => onAddProduct(p));
  };

  if (!user || user.role !== 'admin') {
    return <div className="pt-32 text-center">Unauthorized Access</div>;
  }

  return (
    <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-500">Manage your marketplace operations.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {products.length === 0 && (
            <button 
              onClick={seedData}
              className="px-4 py-2 bg-amber-600 text-white rounded-full text-sm font-bold"
            >
              Seed Initial Data
            </button>
          )}
          <div className="flex bg-gray-100 p-1 rounded-full">
            {[
              { id: 'inventory', label: 'Inventory', icon: <Package size={16} /> },
              { id: 'listings', label: 'User Listings', icon: <PlusCircle size={16} /> },
              { id: 'orders', label: 'Orders', icon: <ShoppingCart size={16} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-6 py-2 rounded-full text-sm font-bold flex items-center space-x-2 transition-all",
                  activeTab === tab.id ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xl shadow-gray-200/50">
        {activeTab === 'inventory' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Product Inventory</h2>
              <button 
                onClick={() => onAddProduct({
                  name: 'New Gadget ' + (products.length + 1),
                  description: 'Premium gadget description',
                  price: 999,
                  category: 'smartphone',
                  condition: 'new',
                  stock: 10,
                  imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=800'
                })}
                className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-bold flex items-center space-x-2"
              >
                <PlusCircle size={18} />
                <span>Add Product</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Product</th>
                    <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Category</th>
                    <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Price</th>
                    <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Stock</th>
                    <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(p => (
                    <tr key={p.id} className="group">
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          <span className="font-bold text-gray-900">{p.name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-500 capitalize">{p.category}</td>
                      <td className="py-4 font-bold text-gray-900">${p.price}</td>
                      <td className="py-4 text-sm text-gray-500">{p.stock} units</td>
                      <td className="py-4">
                        <button 
                          onClick={() => onDeleteProduct(p.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-8">Pending User Submissions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {listings.filter(l => l.status === 'pending').map(l => (
                <div key={l.id} className="p-6 rounded-2xl border border-gray-100 bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg">{l.name}</h3>
                      <p className="text-xs text-gray-500">Seller: {l.sellerEmail}</p>
                    </div>
                    <span className="text-xl font-bold text-emerald-600">${l.expectedPrice}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-6 line-clamp-2">{l.description}</p>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => onApproveListing(l.id)}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold"
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => onRejectListing(l.id)}
                      className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-bold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
              {listings.filter(l => l.status === 'pending').length === 0 && (
                <div className="col-span-2 text-center py-12 text-gray-400">No pending listings</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="p-8">
            <h2 className="text-2xl font-bold mb-8">Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Order ID</th>
                    <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Customer</th>
                    <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Total</th>
                    <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Status</th>
                    <th className="pb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td className="py-4 font-mono text-xs text-gray-500">{o.id.slice(0, 8)}...</td>
                      <td className="py-4 text-sm font-medium">{o.userId.slice(0, 8)}...</td>
                      <td className="py-4 font-bold text-gray-900">${o.totalAmount}</td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase">
                          {o.status}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [listings, setListings] = useState<UserListing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth Listener
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUser({ uid: firebaseUser.uid, ...userDoc.data() } as UserProfile);
          } else {
            const newUser: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              role: firebaseUser.email === 'kl2508019635@student.uptm.edu.my' ? 'admin' : 'user'
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              email: newUser.email,
              displayName: newUser.displayName,
              role: newUser.role,
              createdAt: new Date().toISOString()
            });
            setUser(newUser);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    // Products Listener (Public)
    const unsubscribeProducts = onSnapshot(
      collection(db, 'products'), 
      (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'products')
    );

    let unsubscribeListings: (() => void) | undefined;
    let unsubscribeOrders: (() => void) | undefined;

    // Admin-only listeners
    if (user?.role === 'admin') {
      unsubscribeListings = onSnapshot(
        collection(db, 'userListings'), 
        (snapshot) => {
          setListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserListing)));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'userListings')
      );

      unsubscribeOrders = onSnapshot(
        collection(db, 'orders'), 
        (snapshot) => {
          setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, 'orders')
      );
    } else if (user) {
      // Regular user listeners (only their own data)
      const listingsQuery = query(collection(db, 'userListings'), where('sellerId', '==', user.uid));
      unsubscribeListings = onSnapshot(
        listingsQuery,
        (snapshot) => {
          setListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserListing)));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `userListings (user: ${user.uid})`)
      );

      const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid));
      unsubscribeOrders = onSnapshot(
        ordersQuery,
        (snapshot) => {
          setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
        },
        (error) => handleFirestoreError(error, OperationType.LIST, `orders (user: ${user.uid})`)
      );
    }

    return () => {
      unsubscribeProducts();
      if (unsubscribeListings) unsubscribeListings();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        console.log('Login popup closed by user');
      } else {
        console.error('Login error:', err);
        alert('Login failed. Please try again.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const updateCartQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart(prev => prev.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleCheckout = async () => {
    if (!user) return handleLogin();
    
    try {
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 15;
      await addDoc(collection(db, 'orders'), {
        userId: user.uid,
        items: cart,
        totalAmount: total,
        status: 'paid',
        createdAt: new Date().toISOString()
      });
      setCart([]);
      alert('Order placed successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
      alert('Checkout failed');
    }
  };

  const handleApproveListing = async (id: string) => {
    const listing = listings.find(l => l.id === id);
    if (!listing) return;
    
    try {
      // 1. Update listing status
      await updateDoc(doc(db, 'userListings', id), { status: 'approved' });
      
      // 2. Add as product
      await addDoc(collection(db, 'products'), {
        name: listing.name,
        description: listing.description,
        price: listing.expectedPrice,
        category: listing.category,
        condition: listing.condition,
        stock: 1,
        imageUrl: listing.imageUrl,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `userListings/${id}`);
    }
  };

  const handleRejectListing = async (id: string) => {
    try {
      await updateDoc(doc(db, 'userListings', id), { status: 'rejected' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `userListings/${id}`);
    }
  };

  const handleAddProduct = async (p: any) => {
    try {
      await addDoc(collection(db, 'products'), {
        ...p,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'products');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-3xl font-bold text-emerald-600"
        >
          DenwaGadjetKu
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
        <Navbar 
          user={user} 
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} 
          onLogin={handleLogin} 
          onLogout={handleLogout} 
        />
        
        <main>
          <Routes>
            <Route path="/" element={<Home products={products} />} />
            <Route path="/shop" element={<Shop products={products} />} />
            <Route path="/product/:id" element={<ProductDetail products={products} onAddToCart={addToCart} />} />
            <Route path="/sell" element={<SellGadget user={user} />} />
            <Route path="/cart" element={<Cart items={cart} onUpdateQuantity={updateCartQuantity} onRemove={removeFromCart} onCheckout={handleCheckout} />} />
            <Route path="/admin" element={
              user?.role === 'admin' ? (
                <AdminPanel 
                  user={user} 
                  products={products} 
                  listings={listings} 
                  orders={orders}
                  onApproveListing={handleApproveListing}
                  onRejectListing={handleRejectListing}
                  onAddProduct={handleAddProduct}
                  onDeleteProduct={handleDeleteProduct}
                />
              ) : (
                <div className="pt-32 pb-20 max-w-xl mx-auto px-4 text-center">
                  <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <X size={40} />
                  </div>
                  <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
                  <p className="text-gray-500 mb-8">You do not have permission to access the admin panel. Please login with an admin account.</p>
                  <Link to="/" className="px-8 py-3 bg-slate-900 text-white rounded-full font-bold">Return Home</Link>
                </div>
              )
            } />
          </Routes>
        </main>

        <footer className="bg-gray-900 text-white py-20 mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="col-span-1 md:col-span-2">
                <Link to="/" className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-6 inline-block">
                  DenwaGadjetKu
                </Link>
                <p className="text-gray-400 max-w-md leading-relaxed">
                  The ultimate destination for premium gadgets. We bridge the gap between quality and affordability, offering a secure platform for tech enthusiasts to buy and sell.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-6 text-lg">Quick Links</h4>
                <ul className="space-y-4 text-gray-400">
                  <li><Link to="/shop" className="hover:text-emerald-400 transition-colors">Shop All</Link></li>
                  <li><Link to="/sell" className="hover:text-emerald-400 transition-colors">Sell Gadget</Link></li>
                  <li><Link to="/cart" className="hover:text-emerald-400 transition-colors">Your Cart</Link></li>
                  <li><Link to="/" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold mb-6 text-lg">Contact</h4>
                <ul className="space-y-4 text-gray-400">
                  <li>support@denwagadjetku.co</li>
                  <li>+60 123 456 789</li>
                  <li>Kuala Lumpur, Malaysia</li>
                </ul>
              </div>
            </div>
            <div className="mt-20 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
              © 2026 DenwaGadjetKu.co. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
