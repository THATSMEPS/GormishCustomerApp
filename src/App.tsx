// App.tsx

import { useEffect, useState, useCallback } from 'react';
import { useScroll, useTransform } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { Restaurant } from './types/restaurant.types';
import { Header } from './components/Header';
import { LocationPopup } from './components/LocationPopup';
import { ProfilePopup } from './components/ProfilePopup';
import { RestaurantPage } from './components/RestaurantPage';
import { OrderTrackingScreen } from './components/OrderTrackingScreen';
import { RestaurantGrid } from './components/RestaurantGrid';
import { PageTitle } from './components/PageTitle';
import { fetchRestaurantById } from './apis/restaurant.api';
import { Customer, StructuredCustomerAddress } from './types/customer.types';
import { Area } from './types/area.types';
import { fetchCustomerById, updateCustomerPhone } from './apis/customer.api';
import { fetchAreas } from './apis/area.api';
import { OrderHistory } from './components/OrderHistory';
import { LoginPopup } from './components/LoginPopup'; 
import { GoogleOAuthProvider } from '@react-oauth/google';
import { CuisineGrid } from './components/CuisineGrid';
import { PhonePopup } from './components/PhonePopup';
import { setupWebViewIntegration } from './webview-integration';

const RestaurantPageWrapper = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRestaurantDetails = async () => {
      if (!restaurantId) {
        setError('Restaurant ID is required');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const restaurantResponse = await fetchRestaurantById(restaurantId);
        if (!restaurantResponse.success) {
          throw new Error(restaurantResponse.message);
        }
        
        setRestaurant(restaurantResponse.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load restaurant details');
      } finally {
        setLoading(false);
      }
    };

    loadRestaurantDetails();
  }, [restaurantId]);

  const handleOrder = (orderId: string) => {
    navigate(`/order/${orderId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F2F5] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md px-4">
          <div className="h-40 bg-white rounded-[25px] shimmer" />
          <div className="h-6 w-3/4 bg-white rounded-full shimmer" />
          <div className="h-4 w-1/2 bg-white rounded-full shimmer" />
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-[#F2F2F5] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="text-[#6552FF] hover:underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <RestaurantPage 
      restaurant={restaurant} 
      onBack={() => navigate("/")}
      onOrder={handleOrder}
    />
  );
};

const OrderHistoryRouteWrapper = () => {
  const navigate = useNavigate();
  return <OrderHistory onBack={() => navigate('/')} />;
};

function MainApp({ customerId }: { customerId: string | null }) {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showPhonePopup, setShowPhonePopup] = useState(false);
  
  const [selectedArea, setSelectedArea] = useState<string>(
    localStorage.getItem('selectedArea') || " "
  );
  const [selectedTopCategory, setSelectedTopCategory] = useState<string | null>(null); 
  const [selectedCuisineFilter, setSelectedCuisineFilter] = useState<string | null>(null);

  const [appSearchText, setAppSearchText] = useState<string>('');

  const [customerDataForPopup, setCustomerDataForPopup] = useState<Customer | null>(() => {
    const storedCustomer = localStorage.getItem('customerData');
    return storedCustomer ? JSON.parse(storedCustomer) : null;
  });
  
  const [availableAreasForPopup, setAvailableAreasForPopup] = useState<Area[]>(() => {
    const storedAreas = localStorage.getItem('availableAreas');
    return storedAreas ? JSON.parse(storedAreas) : [];
  });
  
  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);

  // New handler for updating phone number via popup
  const handleUpdatePhone = async (id: string, phoneNum: string) => {
    const result = await updateCustomerPhone(id, phoneNum);
    return result; // Return the result for PhonePopup to handle success/error
  };

  const performInitialCustomerChecks = useCallback((customer: Customer) => {
  // 1. Phone Check: If phone is missing, show PhonePopup
  if (!customer.phone || (typeof customer.phone === 'string' && customer.phone.trim() === '')) {
    console.log("Customer phone is empty. Showing PhonePopup.");
    setShowPhonePopup(true);
    return; // Stop here, only one popup at a time. Address check will happen after phone update.
  }

  // 2. Address/AreaId Check: If address or areaId is missing, show LocationPopup
  // This check runs ONLY if PhonePopup is NOT active.

  let isAddressDataMissingOrEmpty = true; // Default to true, will be false if data is present and valid
  // Check if customer.address exists and is an object
  if (customer.address && typeof customer.address === 'object') {
    const typedAddress = (customer.address as StructuredCustomerAddress).typedAddress;
    // Check if typedAddress is a non-empty string
    if (typeof typedAddress === 'string' && typedAddress.trim() !== '') {
      isAddressDataMissingOrEmpty = false;
    }
  }
  
  let isAreaIdDataMissingOrEmpty = true; // Default to true, will be false if data is present and valid
  // Check if customer.areaId exists and is a non-empty string
  if (customer.areaId && typeof customer.areaId === 'string' && customer.areaId.trim() !== '') {
    isAreaIdDataMissingOrEmpty = false;
  }

  // Agar PhonePopup show nahi ho raha hai aur address ya areaId mein se koi bhi missing/empty hai
  if (!showPhonePopup && (isAddressDataMissingOrEmpty || isAreaIdDataMissingOrEmpty)) {
    console.log("Customer address (typedAddress) or areaId is empty/null. Showing LocationPopup.");
    setShowLocationPopup(true);
  } else {
    // If all checks pass, ensure both popups are closed
    setShowPhonePopup(false);
    setShowLocationPopup(false);
  }
}, [showPhonePopup]);

  useEffect(() => {
    if (!hasFetchedInitialData) {
      // Check if data is already in state/localStorage from previous session
      if (customerDataForPopup && customerDataForPopup.area && availableAreasForPopup.length > 0) {
        setSelectedArea(customerDataForPopup.area.areaName);
        setHasFetchedInitialData(true);
        // After setting initial data, perform phone and address checks
        performInitialCustomerChecks(customerDataForPopup);
        return; 
      }
      
      const fetchInitialCustomerAndAreas = async () => {
        if (!customerId || customerId.trim() === "") { 
          console.warn("App.tsx: Skipping fetchInitialCustomerAndAreas as customerId is missing or empty.");
          setHasFetchedInitialData(true);
          return;
        }

        try {
          console.log("App.tsx: customerId before fetchCustomerById:", customerId);

          const customerResponse = await fetchCustomerById(customerId);
          let fetchedCustomer: Customer | null = null;
          if (customerResponse.success && customerResponse.data) {
            setCustomerDataForPopup(customerResponse.data);
            fetchedCustomer = customerResponse.data;
            localStorage.setItem('customerData', JSON.stringify(customerResponse.data)); 
          } else {
            console.error("Failed to fetch customer details for initial load:", customerResponse.message);
            setCustomerDataForPopup(null); 
          }

          const areasResponse = await fetchAreas();
          if (areasResponse.success && areasResponse.data) {
            setAvailableAreasForPopup(areasResponse.data);
            localStorage.setItem('availableAreas', JSON.stringify(areasResponse.data)); 
            
            if (fetchedCustomer && fetchedCustomer.areaId) {
              const matchedArea = areasResponse.data.find(area => area.id === fetchedCustomer.areaId);
              if (matchedArea) {
                setSelectedArea(matchedArea.areaName);
                localStorage.setItem('selectedArea', matchedArea.areaName); 
              } else {
                setSelectedArea('Navrangpura'); 
                localStorage.setItem('selectedArea', 'Navrangpura');
              }
            } else {
                setSelectedArea('Navrangpura'); 
                localStorage.setItem('selectedArea', 'Navrangpura');
            }
          } else {
            console.error("Failed to fetch areas for initial load:", areasResponse.message);
            if (!localStorage.getItem('selectedArea') || localStorage.getItem('selectedArea') === " ") {
              setSelectedArea('Navrangpura');
              localStorage.setItem('selectedArea', 'Navrangpura');
            }
          }

          // After fetching customer data, check for phone and address
          if (fetchedCustomer) {
            performInitialCustomerChecks(fetchedCustomer);
          }

        } catch (error) {
          console.error("Error fetching initial data:", error);
          if (!localStorage.getItem('selectedArea') || localStorage.getItem('selectedArea') === " ") {
            setSelectedArea('Navrangpura');
            localStorage.setItem('selectedArea', 'Navrangpura');
          }
        } finally {
          setHasFetchedInitialData(true); 
        }
      };
      fetchInitialCustomerAndAreas();
    }
  }, [hasFetchedInitialData, customerDataForPopup, availableAreasForPopup, customerId, performInitialCustomerChecks]); 

  // Update selectedArea in localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedArea', selectedArea);
  }, [selectedArea]);

  const handleLocationClick = async () => {
    setShowLocationPopup(true);
    console.log("Fetching fresh data for LocationPopup.");
    try {
      if (customerId) {
        const customerResponse = await fetchCustomerById(customerId);
        if (customerResponse.success && customerResponse.data) {
          setCustomerDataForPopup(customerResponse.data);
          localStorage.setItem('customerData', JSON.stringify(customerResponse.data));
        } else {
          console.error("Failed to fetch customer data for LocationPopup:", customerResponse.message);
          setCustomerDataForPopup(null);
        }
      }

      const areasResponse = await fetchAreas();
      if (areasResponse.success && areasResponse.data) {
        setAvailableAreasForPopup(areasResponse.data);
        localStorage.setItem('availableAreas', JSON.stringify(areasResponse.data));
      } else {
        console.error("Failed to fetch areas for LocationPopup:", areasResponse.message);
        setAvailableAreasForPopup([]);
      }
    } catch (error) {
      console.error("Error fetching data for LocationPopup:", error);
      setCustomerDataForPopup(null);
      setAvailableAreasForPopup([]);
    }
  };

  const handleAreaSelection = async (newAreaName: string) => {
    setSelectedArea(newAreaName);
    console.log("Location updated in popup, re-fetching customer and areas data for app sync.");
    try {
      if (customerId) {
        const customerResponse = await fetchCustomerById(customerId);
        if (customerResponse.success && customerResponse.data) {
          setCustomerDataForPopup(customerResponse.data);
          localStorage.setItem('customerData', JSON.stringify(customerResponse.data));
          // After updating customer data, immediately re-check if address is still empty
          // This handles cases where only area was set, but typedAddress might still be missing.
          // Re-run the checks to see if LocationPopup should remain open or close.
          performInitialCustomerChecks(customerResponse.data); 
        } else {
          console.error("Failed to re-fetch customer data after area selection:", customerResponse.message);
        }
      }

      const areasResponse = await fetchAreas();
      if (areasResponse.success && areasResponse.data) {
        setAvailableAreasForPopup(areasResponse.data);
        localStorage.setItem('availableAreas', JSON.stringify(areasResponse.data));
      } else {
        console.error("Failed to re-fetch areas after area selection:", areasResponse.message);
      }
    } catch (error) {
      console.error("Error re-fetching data after area selection:", error);
    }
  };
  
  const headerBackground = useTransform(
    scrollY,
    [0, 100],
    ['rgba(242, 242, 245, 0)', 'rgba(242, 242, 245, 0.95)']
  );

  useEffect(() => {
    return () => {
    };
  }, []); 

  const customerDataLocal = localStorage.getItem("customerData") 
  let orderIdFromTrackBabyButton = ""
  if(customerDataLocal) {
    const parsedCustomerData = JSON.parse(customerDataLocal);
    if (parsedCustomerData.orders && Array.isArray(parsedCustomerData.orders)) {
      if (parsedCustomerData.orders.length > 0) {
      orderIdFromTrackBabyButton = parsedCustomerData.orders[0].id
    }
  }
  }

  const handleCuisineCardClick = useCallback((cuisineName: string) => {
    if (selectedCuisineFilter === cuisineName) {
      setSelectedCuisineFilter(null);
    } else {
      setSelectedCuisineFilter(cuisineName);
    }
    setSelectedTopCategory(null);
    setAppSearchText('');
  }, [selectedCuisineFilter]);

  const handleTopCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedTopCategory(categoryId);
    setSelectedCuisineFilter(null);
    setAppSearchText('');
  }, []);

  return (
    <div className="min-h-screen bg-[#F2F2F5]">
      {/* Phone Number Popup */}
      {customerId && ( // Only render if customerId is available
        <PhonePopup
          isOpen={showPhonePopup}
          onClose={(updatedCustomerData) => {
            setShowPhonePopup(false); // Close the phone popup
            if (updatedCustomerData) {
              setCustomerDataForPopup(updatedCustomerData);
              localStorage.setItem('customerData', JSON.stringify(updatedCustomerData));
              // After phone is updated, immediately re-check for address
              performInitialCustomerChecks(updatedCustomerData); 
            } else {
              console.warn("PhonePopup closed without updated customer data.");
              if (customerDataForPopup) {
                performInitialCustomerChecks(customerDataForPopup);
              }
            }
          }}
          currentPhone={customerDataForPopup?.phone || null}
          customerId={customerId}
          onUpdatePhone={handleUpdatePhone}
        />
      )}

      <LocationPopup 
        isOpen={showLocationPopup} 
        onClose={() => setShowLocationPopup(false)}
        onAreaSelect={handleAreaSelection}
        initialCustomerData={customerDataForPopup} 
        initialAvailableAreas={availableAreasForPopup} 
      />
      <ProfilePopup 
        isOpen={showProfilePopup}
        onClose={() => setShowProfilePopup(false)}
        onOrderHistoryClick={() => {
          setShowProfilePopup(false);
          navigate('/orders');
        }}
        onLogoutClick={() => {
          setShowProfilePopup(false);
          localStorage.clear()
          window.location.reload()
        }}
      />
      
      <Header 
        headerBackground={headerBackground}
        selectedArea={selectedArea}
        selectedCategory={selectedTopCategory}
        onLocationClick={handleLocationClick} 
        onProfileClick={() => setShowProfilePopup(true)}
        onTrackOrder={() => {
          navigate(`/order/${orderIdFromTrackBabyButton}`);
        }}
        onCategorySelect={handleTopCategorySelect}
        searchText={appSearchText}
        onSearchChange={setAppSearchText}
      />

      <PageTitle title="Popular Cuisines" /> 
      <CuisineGrid
        onCuisineClick={handleCuisineCardClick}
        selectedCuisine={selectedCuisineFilter}
      />

      <PageTitle title="Top Restaurants" />

      <RestaurantGrid 
        selectedArea={selectedArea}
        selectedCategory={selectedCuisineFilter || selectedTopCategory} 
        onRestaurantClick={(restaurant) => {
          navigate(`/${restaurant.id}`);
        }}
        searchText={appSearchText} 
      />
    </div>
  );
}

function App() {
  useEffect(() => {
    const { sendLoginMessage, sendLogoutMessage } = setupWebViewIntegration();

    // Expose these functions globally to avoid unused variable warning and allow usage elsewhere
    (window as any).sendLoginMessage = sendLoginMessage;
    (window as any).sendLogoutMessage = sendLogoutMessage;

    // Cleanup if needed
    return () => {
      // Any cleanup logic here
      delete (window as any).sendLoginMessage;
      delete (window as any).sendLogoutMessage;
    };
  }, []);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthToken = () => {
      const token = localStorage.getItem('authToken');
      const storedCustomerData = localStorage.getItem('customerData');
      let customerIdFromStorage: string | null = null;

      if (storedCustomerData) {
        try {
          const parsedCustomer = JSON.parse(storedCustomerData);
          if (parsedCustomer && parsedCustomer.id) {
            customerIdFromStorage = parsedCustomer.id;
          }
        } catch (e) {
          console.error("Error parsing customerData from localStorage:", e);
        }
      }

      if (token && customerIdFromStorage) {
        setIsAuthenticated(true);
        setShowLoginPopup(false);
        setCurrentCustomerId(customerIdFromStorage);
        console.log("AuthToken found in localStorage. User is authenticated. Customer ID:", customerIdFromStorage);
      } else {
        setIsAuthenticated(false);
        setShowLoginPopup(true);
        setCurrentCustomerId(null);
        console.log("No AuthToken found or customer ID missing. Opening Login Popup.");
      }
    };
    checkAuthToken(); 

    const handleStorageChange = () => {
      checkAuthToken();
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); 

  if (!isAuthenticated) {
    return (
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <LoginPopup
          isOpen={showLoginPopup} 
          onClose={() => {
            const token = localStorage.getItem('authToken');
            const storedCustomerData = localStorage.getItem('customerData');
            let customerIdFromStorage: string | null = null;
            if (storedCustomerData) {
              try {
                const parsedCustomer = JSON.parse(storedCustomerData);
                if (parsedCustomer && parsedCustomer.id) {
                  customerIdFromStorage = parsedCustomer.id;
                }
              } catch (e) {
                console.error("Error parsing customerData on popup close:", e);
              }
            }

            if (token && customerIdFromStorage) {
              setIsAuthenticated(true); 
              setShowLoginPopup(false); 
              setCurrentCustomerId(customerIdFromStorage);
              console.log("App.tsx (LoginPopup onClose callback): Authenticated, closing popup.");
            } else {
              console.log("App.tsx (LoginPopup onClose callback): AuthToken or Customer ID not found after popup close attempt. Keeping Login Popup open.");
              setShowLoginPopup(true); 
            }
          }}
        />
      </GoogleOAuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <Router>
        <Routes>
          <Route path="/" element={<MainApp customerId={currentCustomerId} />} /> 
          <Route path="/:restaurantId" element={<RestaurantPageWrapper />} />
          <Route path="/order/:orderId" element={<OrderTrackingScreen />} />
          <Route path="/orders" element={<OrderHistoryRouteWrapper />} /> 
        </Routes>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
