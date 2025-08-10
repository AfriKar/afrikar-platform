import React, { useState, useEffect, createContext, useContext } from 'react';
import './App.css';

// Auth Context
const AuthContext = createContext();

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, [token]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// API service
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}/api${endpoint}`;
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Erreur réseau' }));
      throw new Error(error.detail || error.message || 'Erreur inconnue');
    }

    return response.json();
  },

  get(endpoint) {
    return this.request(endpoint);
  },

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: data,
    });
  },
};

// Components
const Header = ({ currentView, setCurrentView }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gradient-to-r from-orange-500 to-green-600 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 via-yellow-500 to-green-600 rounded-xl shadow-lg flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10 text-white font-bold text-lg transform -rotate-12">
                <div className="flex items-center">
                  <span className="text-2xl">🌍</span>
                  <span className="ml-1 text-xs">AF</span>
                </div>
              </div>
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full"></div>
                <div className="absolute top-3 right-2 w-1 h-1 bg-white rounded-full"></div>
                <div className="absolute bottom-2 left-3 w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="absolute bottom-1 right-1 w-1 h-1 bg-white rounded-full"></div>
              </div>
              <div className="absolute inset-0">
                <svg className="w-full h-full opacity-20" viewBox="0 0 64 64">
                  <path d="M32 8L16 24L32 40L48 24L32 8Z" fill="currentColor"/>
                  <path d="M32 40L16 56L48 56L32 40Z" fill="currentColor"/>
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">AfriKar</h1>
              <p className="text-orange-100 text-sm">Covoiturage au Sénégal</p>
            </div>
          </div>
          
          {user && (
            <div className="flex items-center space-x-4">
              <span className="text-white">Bonjour, {user.prenom}</span>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Mon Tableau de Bord
              </button>
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const Landing = ({ setCurrentView }) => {
  const [searchData, setSearchData] = useState({
    ville_depart: '',
    ville_arrivee: '',
    date_depart: ''
  });
  const [cities, setCities] = useState([]);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCities();
    loadRides();
  }, []);

  const loadCities = async () => {
    try {
      const response = await api.get('/cities');
      setCities(response.cities);
    } catch (error) {
      console.error('Erreur lors du chargement des villes:', error);
    }
  };

  const loadRides = async () => {
    try {
      const response = await api.get('/trajets');
      setRides(response.slice(0, 6)); // Show only first 6 rides
    } catch (error) {
      console.error('Erreur lors du chargement des trajets:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(searchData).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await api.get(`/trajets?${queryParams}`);
      setRides(response);
    } catch (error) {
      alert('Erreur lors de la recherche: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-400 via-orange-500 to-green-500 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Voyagez Ensemble au Sénégal
          </h1>
          <p className="text-xl mb-8 text-orange-100">
            Partagez vos trajets, économisez de l'argent et créez des liens
          </p>
          
          {/* Search Form */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
            <form onSubmit={handleSearch} className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">De</label>
                <select
                  value={searchData.ville_depart}
                  onChange={(e) => setSearchData({...searchData, ville_depart: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-800"
                >
                  <option value="">Toutes les villes</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Vers</label>
                <select
                  value={searchData.ville_arrivee}
                  onChange={(e) => setSearchData({...searchData, ville_arrivee: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-800"
                >
                  <option value="">Toutes les villes</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={searchData.date_depart}
                  onChange={(e) => setSearchData({...searchData, date_depart: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-800"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Recherche...' : 'Rechercher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Proposer un Trajet</h3>
              <p className="text-gray-600 mb-6">Vous avez une voiture ? Partagez vos trajets et gagnez de l'argent</p>
              <button
                onClick={() => setCurrentView('auth')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Commencer
              </button>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Trouver un Trajet</h3>
              <p className="text-gray-600 mb-6">Recherchez des trajets disponibles et voyagez à petit prix</p>
              <button
                onClick={() => setCurrentView('auth')}
                className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Rechercher
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Rides */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Trajets Récents</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rides.map(ride => (
              <div key={ride.id} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {ride.ville_depart} → {ride.ville_arrivee}
                    </h3>
                    <p className="text-gray-600">{ride.date_depart} à {ride.heure_depart}</p>
                  </div>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                    {ride.prix_par_place} FCFA
                  </span>
                </div>
                
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Conducteur:</span> {ride.conducteur_nom}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Places disponibles:</span> {ride.places_disponibles}
                  </p>
                  {ride.description && (
                    <p className="text-sm text-gray-600">{ride.description}</p>
                  )}
                </div>
                
                <button
                  onClick={() => setCurrentView('auth')}
                  className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white py-2 px-4 rounded-lg font-medium transition-all"
                >
                  Réserver
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const Auth = ({ setCurrentView }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    mot_de_passe: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const endpoint = isLogin ? '/connexion' : '/inscription';
      const response = await api.post(endpoint, formData);
      
      login(response.user, response.access_token);
      setCurrentView('dashboard');
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 to-green-500 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            {isLogin ? 'Connexion' : 'Inscription'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte AfriKar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <input
                  type="text"
                  placeholder="Prénom"
                  value={formData.prenom}
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  required
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </>
          )}
          
          <div>
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <input
              type="password"
              placeholder="Mot de passe"
              value={formData.mot_de_passe}
              onChange={(e) => setFormData({...formData, mot_de_passe: e.target.value})}
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-green-600 hover:from-orange-600 hover:to-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se Connecter' : "S'inscrire")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            {isLogin 
              ? "Pas encore de compte ? S'inscrire" 
              : "Déjà un compte ? Se connecter"
            }
          </button>
        </div>
        
        <div className="mt-4 text-center">
          <button
            onClick={() => setCurrentView('landing')}
            className="text-gray-500 hover:text-gray-700"
          >
            ← Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [cities, setCities] = useState([]);
  const [rides, setRides] = useState([]);
  const [myRides, setMyRides] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Search form
  const [searchData, setSearchData] = useState({
    ville_depart: '',
    ville_arrivee: '',
    date_depart: ''
  });
  
  // Create ride form
  const [rideData, setRideData] = useState({
    ville_depart: '',
    ville_arrivee: '',
    date_depart: '',
    heure_depart: '',
    places_disponibles: 1,
    prix_par_place: '',
    description: '',
    vehicule_info: ''
  });

  useEffect(() => {
    loadCities();
    loadRides();
    if (activeTab === 'my-rides') loadMyRides();
    if (activeTab === 'bookings') loadMyBookings();
  }, [activeTab]);

  const loadCities = async () => {
    try {
      const response = await api.get('/cities');
      setCities(response.cities);
    } catch (error) {
      console.error('Erreur lors du chargement des villes:', error);
    }
  };

  const loadRides = async () => {
    try {
      const response = await api.get('/trajets');
      setRides(response);
    } catch (error) {
      console.error('Erreur lors du chargement des trajets:', error);
    }
  };

  const loadMyRides = async () => {
    try {
      const response = await api.get('/mes-trajets');
      setMyRides(response);
    } catch (error) {
      console.error('Erreur lors du chargement de mes trajets:', error);
    }
  };

  const loadMyBookings = async () => {
    try {
      const response = await api.get('/mes-reservations');
      setMyBookings(response);
    } catch (error) {
      console.error('Erreur lors du chargement de mes réservations:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      Object.entries(searchData).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
      
      const response = await api.get(`/trajets?${queryParams}`);
      setRides(response);
    } catch (error) {
      alert('Erreur lors de la recherche: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRide = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/trajets', rideData);
      alert('Trajet créé avec succès!');
      setRideData({
        ville_depart: '',
        ville_arrivee: '',
        date_depart: '',
        heure_depart: '',
        places_disponibles: 1,
        prix_par_place: '',
        description: '',
        vehicule_info: ''
      });
      setActiveTab('my-rides');
      loadMyRides();
    } catch (error) {
      alert('Erreur lors de la création: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookRide = async (trajetId) => {
    const places = prompt('Combien de places souhaitez-vous réserver ?');
    if (!places || isNaN(places) || parseInt(places) < 1) return;
    
    try {
      await api.post('/reservations', {
        trajet_id: trajetId,
        nombre_places: parseInt(places)
      });
      alert('Réservation effectuée avec succès!');
      loadRides(); // Refresh rides list
    } catch (error) {
      alert('Erreur lors de la réservation: ' + error.message);
    }
  };

  const tabs = [
    { id: 'search', title: 'Rechercher', icon: '🔍' },
    { id: 'create', title: 'Créer un trajet', icon: '➕' },
    { id: 'my-rides', title: 'Mes trajets', icon: '🚗' },
    { id: 'bookings', title: 'Mes réservations', icon: '🎫' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-orange-500 to-green-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.title}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {activeTab === 'search' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Rechercher un Trajet</h2>
              
              <form onSubmit={handleSearch} className="grid md:grid-cols-4 gap-4 mb-8">
                <select
                  value={searchData.ville_depart}
                  onChange={(e) => setSearchData({...searchData, ville_depart: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Ville de départ</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                
                <select
                  value={searchData.ville_arrivee}
                  onChange={(e) => setSearchData({...searchData, ville_arrivee: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Ville d'arrivée</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                
                <input
                  type="date"
                  value={searchData.date_depart}
                  onChange={(e) => setSearchData({...searchData, date_depart: e.target.value})}
                  className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
                
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-orange-500 to-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-green-700 disabled:opacity-50"
                >
                  {loading ? 'Recherche...' : 'Rechercher'}
                </button>
              </form>

              <div className="grid md:grid-cols-2 gap-6">
                {rides.map(ride => (
                  <div key={ride.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {ride.ville_depart} → {ride.ville_arrivee}
                        </h3>
                        <p className="text-gray-600">{ride.date_depart} à {ride.heure_depart}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                        {ride.prix_par_place} FCFA
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Conducteur:</span> {ride.conducteur_nom}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Téléphone:</span> {ride.conducteur_telephone}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Places disponibles:</span> {ride.places_disponibles}
                      </p>
                      {ride.vehicule_info && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Véhicule:</span> {ride.vehicule_info}
                        </p>
                      )}
                      {ride.description && (
                        <p className="text-sm text-gray-600">{ride.description}</p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleBookRide(ride.id)}
                      className="w-full bg-gradient-to-r from-orange-500 to-green-600 text-white py-2 px-4 rounded-lg font-medium hover:from-orange-600 hover:to-green-700 transition-all"
                    >
                      Réserver
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Créer un Nouveau Trajet</h2>
              
              <form onSubmit={handleCreateRide} className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Ville de départ *</label>
                  <select
                    value={rideData.ville_depart}
                    onChange={(e) => setRideData({...rideData, ville_depart: e.target.value})}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Sélectionner une ville</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Ville d'arrivée *</label>
                  <select
                    value={rideData.ville_arrivee}
                    onChange={(e) => setRideData({...rideData, ville_arrivee: e.target.value})}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Sélectionner une ville</option>
                    {cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Date de départ *</label>
                  <input
                    type="date"
                    value={rideData.date_depart}
                    onChange={(e) => setRideData({...rideData, date_depart: e.target.value})}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Heure de départ *</label>
                  <input
                    type="time"
                    value={rideData.heure_depart}
                    onChange={(e) => setRideData({...rideData, heure_depart: e.target.value})}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Places disponibles *</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={rideData.places_disponibles}
                    onChange={(e) => setRideData({...rideData, places_disponibles: parseInt(e.target.value)})}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Prix par place (FCFA) *</label>
                  <input
                    type="number"
                    min="0"
                    value={rideData.prix_par_place}
                    onChange={(e) => setRideData({...rideData, prix_par_place: parseFloat(e.target.value)})}
                    required
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">Information sur le véhicule</label>
                  <input
                    type="text"
                    placeholder="Ex: Toyota Corolla blanche, plaque 123-ABC-45"
                    value={rideData.vehicule_info}
                    onChange={(e) => setRideData({...rideData, vehicule_info: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-2">Description</label>
                  <textarea
                    placeholder="Informations supplémentaires sur le trajet..."
                    value={rideData.description}
                    onChange={(e) => setRideData({...rideData, description: e.target.value})}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-orange-600 hover:to-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Création...' : 'Créer le Trajet'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'my-rides' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Mes Trajets</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {myRides.map(ride => (
                  <div key={ride.id} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {ride.ville_depart} → {ride.ville_arrivee}
                        </h3>
                        <p className="text-gray-600">{ride.date_depart} à {ride.heure_depart}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                        {ride.prix_par_place} FCFA
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Places disponibles:</span> {ride.places_disponibles}
                      </p>
                      {ride.vehicule_info && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Véhicule:</span> {ride.vehicule_info}
                        </p>
                      )}
                      {ride.description && (
                        <p className="text-sm text-gray-600">{ride.description}</p>
                      )}
                    </div>
                  </div>
                ))}
                
                {myRides.length === 0 && (
                  <div className="md:col-span-2 text-center py-12">
                    <p className="text-gray-500 text-lg">Vous n'avez pas encore créé de trajets.</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="mt-4 bg-gradient-to-r from-orange-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                      Créer mon premier trajet
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Mes Réservations</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {myBookings.map(booking => (
                  <div key={booking.id} className="border border-gray-200 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {booking.trajet.ville_depart} → {booking.trajet.ville_arrivee}
                        </h3>
                        <p className="text-gray-600">{booking.trajet.date_depart} à {booking.trajet.heure_depart}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                        {booking.statut}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Places réservées:</span> {booking.nombre_places}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Prix total:</span> {booking.trajet.prix_par_place * booking.nombre_places} FCFA
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Conducteur:</span> {booking.trajet.conducteur_nom}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Téléphone:</span> {booking.trajet.conducteur_telephone}
                      </p>
                    </div>
                  </div>
                ))}
                
                {myBookings.length === 0 && (
                  <div className="md:col-span-2 text-center py-12">
                    <p className="text-gray-500 text-lg">Vous n'avez pas encore de réservations.</p>
                    <button
                      onClick={() => setActiveTab('search')}
                      className="mt-4 bg-gradient-to-r from-orange-500 to-green-600 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                      Rechercher un trajet
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [currentView, setCurrentView] = useState('landing');

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Header currentView={currentView} setCurrentView={setCurrentView} />
        
        {currentView === 'landing' && <Landing setCurrentView={setCurrentView} />}
        {currentView === 'auth' && <Auth setCurrentView={setCurrentView} />}
        {currentView === 'dashboard' && <Dashboard />}
      </div>
    </AuthProvider>
  );
};

export default App;