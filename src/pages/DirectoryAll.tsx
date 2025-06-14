import { useState, useEffect, useRef, useMemo } from 'react';
import { useFunkoPops, useUserCollection } from '@/hooks/useFunkoPops';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Filter, X, Search, Database, Heart, Share2, Plus, CheckCircle, Loader2, ChevronDown, ChevronUp, List, Sparkles, Calendar, Package, Star } from 'lucide-react';
import DashboardHeader from '@/components/DashboardHeader';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useAuth } from "@/hooks/useAuth";
import { useWishlist } from "@/hooks/useWishlist";
import { useAddToCollection } from "@/hooks/useFunkoPops";
import { useCustomLists } from "@/hooks/useCustomLists";
import { useToast } from '@/hooks/use-toast';
import { useNavigate, Link } from 'react-router-dom';
import PriceHistory from '@/components/PriceHistory';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/utils/formatCurrency';

const PAGE_SIZE = 24;

// Move static filter options outside component to prevent recreation
const STATIC_FILTERS = {
  status: ['All', 'Coming Soon', 'New Releases', 'Funko Exclusive', 'Pre-Order', 'In Stock', 'Sold Out'],
  category: [
    'Pop!', 'Bitty Pop!', 'Mini Figures', 'Vinyl Soda', 'Loungefly', 'REWIND', 'Pop! Pins', 'Toys and Plushies', 'Clothing', 'Funko Gear', 'Funko Games'
  ],
  fandom: [
    '8-Bit', 'Ad Icons', 'Air Force', 'Albums', 'Animation', 'Aquasox', 'Army', 'Around the World', 'Artists', 'Art Covers', 'Art Series', 'Asia', 'Bape', 'Basketball', 'Board Games', 'Books', 'Boxing', 'Broadway', 'Build a Bear', 'Candy', 'Christmas', 'Classics', 'College', 'Comedians', 'Comic Covers', 'Comics', 'Conan', 'Custom', 'Deluxe', 'Deluxe Moments', 'Die-Cast', 'Digital', 'Disney', 'Directors', 'Drag Queens', 'Fantastic Beasts', 'Fashion', 'Foodies', 'Football', 'Freddy Funko', 'Fantastik Plastik', 'Lance', 'Game of Thrones', 'Games', 'Game Covers', 'Golf', 'GPK', 'Halo', 'Harry Potter', 'Heroes', 'Hockey', 'Holidays', 'House of the Dragons', 'Icons', 'League of Legends', 'Magic: The Gathering', 'Marines', 'Marvel', 'Magazine Covers', 'Minis', 'MLB', 'Moments', 'Monsters', 'Movie Posters', 'Movies', 'Muppets', 'Myths', 'My Little Pony', 'NASCAR', 'Navy', 'NBA Mascots', 'NFL', 'Pets', 'Pusheen', 'Racing', 'Retro Toys', 'Rides', 'Rocks', 'Royals', 'Sanrio', 'Sci-Fi', 'Sesame Street', 'SNL', 'South Park', 'Special Edition', 'Sports', 'Sports Legends', 'Stan Lee', 'Star Wars', 'Television', 'Tennis', 'The Vote', 'Town', 'Town Christmas', 'Trading Cards', 'Trains', 'Trolls', 'UFC', 'Uglydoll', 'Valiant', 'Vans', 'VHS Covers', 'Wreck-It Ralph', 'Wrestling', 'WWE', 'WWE Covers', 'Zodiac'
  ],
  genre: [
    'Animation', 'Anime & Manga', '80s Flashback', 'Movies & TV', 'Horror', 'Music', 'Sports', 'Video Games', 'Retro Toys', 'Ad Icons'
  ],
  edition: [
    'New Releases', 'Exclusives', 'Convention Style', 'Character Cosplay', 'Rainbow Brights', 'Retro Rewind', 'Theme Park Favourites', 'Disney Princesses', 'All The Sparkles', 'Back in Stock', 'BLACK LIGHT', 'BRONZE', 'BTS X MINIONS', 'CHASE', 'CONVENTION', 'DIAMON COLLECTION', 'DIAMOND COLLECTION', 'EASTER', 'FACET COLLECTION', 'FLOCKED', 'GLITTER', 'GLOW IN THE DARK', 'HOLIDAY', 'HYPERSPACE HEROES', 'LIGHTS AND SOUND', 'MEME', 'METALLIC', 'PEARLESCENT', 'PRIDE', 'RETRO COMIC', 'RETRO SERIES', 'SCOOPS AHOY', 'SOFT COLOUR', "VALENTINE'S"
  ],
  vaulted: ['All', 'Vaulted', 'Available']
};

const DirectoryAll = () => {
  const { data: allPops = [], isLoading } = useFunkoPops();
  const [expandedPop, setExpandedPop] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: [], fandom: [], genre: [], edition: [], status: [], vaulted: 'All', year: ''
  });
  const [ownedConfirmed, setOwnedConfirmed] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState(false);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [addingToListId, setAddingToListId] = useState(null);
  const [selectedPopForList, setSelectedPopForList] = useState(null);
  const [creatingList, setCreatingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const loader = useRef(null);
  
  const { user } = useAuth();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const addToCollection = useAddToCollection();
  const { lists, addItemToList, createList } = useCustomLists();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: userCollection = [] } = useUserCollection(user?.id);
  const { currency } = useCurrency();

  // Always scroll to top on mount to prevent jump-to-bottom bug
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Memoize expensive computations
  const characterOptions = useMemo(() => 
    Array.from(new Set(allPops.map(pop => pop.name).filter(Boolean))).sort(),
    [allPops]
  );
  
  const seriesOptions = useMemo(() => 
    Array.from(new Set(allPops.map(pop => pop.series).filter(Boolean))).sort(),
    [allPops]
  );

  const FILTERS = useMemo(() => ({
    ...STATIC_FILTERS,
    character: characterOptions,
    series: seriesOptions,
  }), [characterOptions, seriesOptions]);

  // Memoize filtered pops
  const filteredPops = useMemo(() => {
    return allPops.filter(pop => {
      const p: any = pop; // allow access to extended fields not in generated types
      // Enhanced search functionality - search across all identification and product fields
      const matchesSearch = !searchTerm || 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.series.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.number && p.number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.fandom && p.fandom.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.upc_a && p.upc_a.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.country_of_registration && p.country_of_registration.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.model_number && p.model_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.size && p.size.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.color && p.color.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.weight && p.weight.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.product_dimensions && p.product_dimensions.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.variant && p.variant.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Existing filters
      const matchesCategory = !filters.category.length || (Array.isArray(filters.category) ? filters.category : []).includes(p.category);
      const matchesFandom = !filters.fandom.length || (Array.isArray(filters.fandom) ? filters.fandom : []).includes(p.fandom);
      const matchesGenre = !filters.genre.length || (Array.isArray(filters.genre) ? filters.genre : []).includes(p.genre);
      
      // Enhanced edition filter to handle "New Releases"
      const matchesEdition = !filters.edition.length || (Array.isArray(filters.edition) ? filters.edition : []).some(edition => {
        if (edition === 'New Releases') {
          return p.data_sources && p.data_sources.includes('new-releases');
        }
        return p.edition === edition;
      });
      
      const matchesVaulted = filters.vaulted === 'All' || (filters.vaulted === 'Vaulted' ? p.is_vaulted : !p.is_vaulted);
      const matchesYear = !filters.year || new Date(p.created_at).getFullYear().toString() === filters.year;
      
      // Status filtering logic
      let matchesStatus = true;
      if (filters.status.length > 0) {
        matchesStatus = filters.status.some(status => {
          switch (status) {
            case 'Coming Soon':
              return p.status === 'Coming Soon' || (p.data_sources && p.data_sources.includes('coming-soon'));
            case 'New Releases':
              // Consider items from new-releases data source or recently released
              const releaseDate = new Date(p.created_at);
              const threeMonthsAgo = new Date();
              threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
              return (p.data_sources && p.data_sources.includes('new-releases')) || 
                     (releaseDate >= threeMonthsAgo && !p.is_vaulted);
            case 'Funko Exclusive':
              return p.edition && p.edition.toLowerCase().includes('exclusive') ||
                     p.fandom && p.fandom.toLowerCase().includes('funko') ||
                     p.category && p.category.toLowerCase().includes('exclusive');
            case 'Pre-Order':
              return p.status === 'Pre-Order' || 
                     p.edition && p.edition.toLowerCase().includes('pre-order');
            case 'In Stock':
              return !p.is_vaulted && p.status !== 'Sold Out' && p.status !== 'Coming Soon';
            case 'Sold Out':
              return p.is_vaulted || p.status === 'Sold Out';
            case 'All':
              return true;
            default:
              return false;
          }
        });
      }
      
      return matchesSearch && matchesCategory && matchesFandom && matchesGenre && matchesEdition && matchesVaulted && matchesYear && matchesStatus;
    });
  }, [allPops, searchTerm, filters]);

  // Memoize years
  const years = useMemo(() => {
    return Array.from(new Set(
      allPops
        .map(pop => pop.created_at ? new Date(pop.created_at).getFullYear() : null)
        .filter(Boolean)
    )).sort((a, b) => b - a);
  }, [allPops]);

  // Infinite scroll - optimize dependency array
  useEffect(() => {
    const handleScroll = () => {
      if (loader.current && window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredPops.length));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filteredPops.length]); // Only depend on length, not entire arrays

  const requireLogin = () => {
    if (!user) {
      navigate('/auth');
      return true;
    }
    return false;
  };

  const handleExpandPop = (pop) => {
    setExpandedPop(expandedPop?.id === pop.id ? null : pop);
  };

  const handleWishlist = (pop) => {
    if (requireLogin()) return;
    const isWishlisted = wishlist.some((w) => w.funko_pop_id === pop.id);
    if (isWishlisted) {
      removeFromWishlist.mutate(pop.id);
    } else {
      addToWishlist.mutate({ funkoPopId: pop.id });
    }
  };

  const handleAddToCollection = (pop) => {
    if (requireLogin()) return;
    if (pop.owned || addingToCollection) return;
    
    setAddingToCollection(true);
    addToCollection.mutate(pop.id, {
      onSuccess: () => {
        setOwnedConfirmed(true);
        setAddingToCollection(false);
        toast({ 
          title: '✅ Added to Collection!', 
          description: `${pop.name} has been added to your collection.`,
          duration: 3000
        });
        // Reset the success state after 5 seconds
        setTimeout(() => setOwnedConfirmed(false), 5000);
      },
      onError: (error) => {
        setAddingToCollection(false);
        // Handle duplicate key error specifically
        if (error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
          toast({
            title: '✅ Already in Collection',
            description: `${pop.name} is already in your collection.`,
            duration: 3000
          });
          // Mark as owned since it's already in collection
          setOwnedConfirmed(true);
          setTimeout(() => setOwnedConfirmed(false), 5000);
        } else {
          toast({
            title: '❌ Failed to Add',
            description: error.message || 'Could not add to collection. Please try again.',
            variant: 'destructive',
            duration: 5000
          });
        }
      }
    });
  };

  const handleShare = (pop) => {
    if (requireLogin()) return;
    const url = `${window.location.origin}/pop/${pop.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied!', description: 'Share this Pop with others.' });
  };

  const handleAddToList = (pop) => {
    if (requireLogin()) return;
    setSelectedPopForList(pop);
    setListModalOpen(true);
  };

  const handleListSelect = (listId) => {
    if (!selectedPopForList) return;
    setAddingToListId(listId);
    addItemToList.mutate({ listId, funkoPopId: selectedPopForList.id }, {
      onSuccess: () => {
        toast({
          title: '✅ Added to List!',
          description: `${selectedPopForList.name} has been added to your list.`,
          duration: 3000
        });
        setListModalOpen(false);
        setSelectedPopForList(null);
        setAddingToListId(null);
      },
      onError: (error) => {
        toast({
          title: '❌ Failed to Add',
          description: error.message || 'Could not add to list. Please try again.',
          variant: 'destructive',
          duration: 5000
        });
        setAddingToListId(null);
      }
    });
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;
    setCreatingList(true);
    createList.mutate({ name: newListName }, {
      onSuccess: (newList) => {
        setNewListName("");
        setCreatingList(false);
        // Automatically add the item to the new list
        if (selectedPopForList && newList?.id) {
          handleListSelect(newList.id);
        }
      },
      onError: () => {
        setCreatingList(false);
        toast({
          title: '❌ Failed to Create List',
          description: 'Could not create list. Please try again.',
          variant: 'destructive',
          duration: 5000
        });
      }
    });
  };

  // Helper function to get the primary image URL (handles both old and new storage methods)
  const getPrimaryImageUrl = (pop) => {
    // If there are user-uploaded images in image_urls array, use the first one
    if (pop.image_urls && Array.isArray(pop.image_urls) && pop.image_urls.length > 0) {
      return pop.image_urls[0];
    }
    // Fall back to the original scraped/imported image_url
    return pop.image_url;
  };

  // Helper function to determine product status badges
  const getProductBadges = (pop) => {
    const badges = [];
    
    // New Release badge (if in new-releases data source or recent)
    if (pop.data_sources?.includes('new-releases')) {
      badges.push({
        text: 'New Release',
        icon: Sparkles,
        className: 'bg-orange-500 hover:bg-orange-600 text-white border-0'
      });
    }
    
    // Coming Soon badge (if has future release date)
    const releaseDate = pop.release_date ? new Date(pop.release_date) : null;
    const now = new Date();
    if (releaseDate && releaseDate > now) {
      badges.push({
        text: 'Coming Soon',
        icon: Calendar,
        className: 'bg-gray-600 hover:bg-gray-700 text-white border-0'
      });
    }
    
    // Exclusive badge
    if (pop.is_exclusive) {
      badges.push({
        text: 'Exclusive',
        icon: Star,
        className: 'bg-purple-600 hover:bg-purple-700 text-purple-100 border-0'
      });
    }
    
    // Vaulted badge
    if (pop.is_vaulted) {
      badges.push({
        text: 'Vaulted',
        icon: Package,
        className: 'bg-red-600 hover:bg-red-700 text-red-100 border-0'
      });
    }
    
    // Source badges
    if (pop.data_sources?.includes('Funko Europe')) {
      badges.push({
        text: 'Funko Europe',
        icon: Package,
        className: 'bg-gray-600 hover:bg-gray-700 text-white border-0'
      });
    }
    
    return badges;
  };

  // Helper function to get user's purchase price for owned items
  const getUserPurchasePrice = (popId) => {
    const userItem = userCollection.find(item => item.funko_pop_id === popId);
    return userItem?.purchase_price || null;
  };

  // Card rendering
  const renderCard = (pop, index) => (
    <Card className="bg-gray-800 border border-gray-700 rounded-lg p-6 mt-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side - Large Image and Buttons */}
        <div className="lg:w-96 lg:flex-shrink-0">
          <div className="aspect-square bg-gray-700 rounded-lg border border-gray-600 overflow-hidden mb-6">
            {getPrimaryImageUrl(pop) ? (
              <img src={getPrimaryImageUrl(pop)} alt={pop.name} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <div className="text-6xl mb-4">📦</div>
                <div className="text-lg">No Image Available</div>
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={pop.owned || ownedConfirmed ? 'default' : 'outline'}
              className={
                pop.owned || ownedConfirmed
                  ? ownedConfirmed 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:text-white shadow-md shadow-green-500/20 border-0 h-9 text-sm font-medium transition-all duration-200 hover:shadow-lg' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:text-white shadow-md shadow-green-500/20 border-0 h-9 text-sm font-medium'
                  : addingToCollection 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:text-white shadow-md shadow-orange-500/20 border-0 h-9 text-sm font-medium' 
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:text-white shadow-md shadow-orange-500/20 border-0 h-9 text-sm font-medium transition-all duration-200 hover:shadow-lg'
              }
              onClick={(e) => {
                e.stopPropagation();
                if (!user) {
                  navigate('/auth');
                  return;
                }
                handleAddToCollection(pop);
              }}
              disabled={pop.owned || ownedConfirmed || addingToCollection}
            >
              {addingToCollection ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Adding...
                </>
              ) : (pop.owned || ownedConfirmed) ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  {ownedConfirmed ? 'Added!' : 'Owned'}
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1.5" />
                  {user ? 'Own this Pop' : 'Sign in to own'}
                </>
              )}
            </Button>
            
            <Button 
              variant="outline"
              className={`h-9 text-sm font-medium transition-all duration-200 ${
                wishlist.some((w) => w.funko_pop_id === pop.id) 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md shadow-red-500/20 border-0 hover:shadow-lg' 
                  : 'border border-red-500/50 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-md hover:shadow-red-500/20 bg-red-500/5'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (!user) {
                  navigate('/auth');
                  return;
                }
                handleWishlist(pop);
              }}
            >
              <Heart className={`w-4 h-4 mr-1.5 ${wishlist.some((w) => w.funko_pop_id === pop.id) ? 'fill-current' : ''}`} />
              {user 
                ? (wishlist.some((w) => w.funko_pop_id === pop.id) ? 'Remove from Wishlist' : 'Add to Wishlist')
                : 'Sign in for Wishlist'
              }
            </Button>

            <Button 
              variant="outline" 
              className="border border-purple-500/50 text-purple-400 hover:bg-purple-500 hover:text-white hover:border-purple-500 hover:shadow-md hover:shadow-purple-500/20 h-9 text-sm font-medium transition-all duration-200 bg-purple-500/5"
              onClick={(e) => {
                e.stopPropagation();
                if (!user) {
                  navigate('/auth');
                  return;
                }
                handleAddToList(pop);
              }}
            >
              <List className="w-4 h-4 mr-1.5" />
              {user ? 'Add to List' : 'Sign in for Lists'}
            </Button>
            
            <Button 
              variant="outline" 
              className="border border-gray-500/50 text-gray-300 hover:bg-gray-500 hover:text-white hover:border-gray-500 hover:shadow-md hover:shadow-gray-500/20 h-9 text-sm font-medium transition-all duration-200 bg-gray-500/5"
              onClick={(e) => {
                e.stopPropagation();
                handleShare(pop);
              }}
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              Share
            </Button>

            {/* View Full Details Button - spans both columns */}
            <Button 
              asChild
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white col-span-2 h-9 text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/20 border-0"
            >
              <Link to={`/pop/${pop.id}`} className="flex items-center justify-center">
                <Search className="w-4 h-4 mr-1.5" />
                View Full Details
              </Link>
            </Button>
          </div>
        </div>

        {/* Right Side - Details */}
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-white mb-6">{pop.name}</h3>
          <p className="text-gray-400 text-lg mb-6">{pop.series}</p>
          
          {/* Basic Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <div className="text-sm text-gray-400 mb-1 flex items-center">
                <span className="mr-2">
                  {pop.category === 'Bitty Pop!' ? '🧸' : 
                   pop.category === 'Vinyl Soda' ? '🥤' : 
                   pop.category === 'Loungefly' ? '🎒' :
                   pop.category === 'Mini Figures' ? '🔗' :
                   pop.category === 'REWIND' ? '📼' :
                   pop.category === 'Pop! Pins' ? '📌' :
                   '📦'}
                </span>
                Category
              </div>
              <div className="font-semibold text-white text-lg">{pop.category || 'Pop!'}</div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <div className="text-sm text-gray-400 mb-1 flex items-center">
                <span className="mr-2">📈</span>
                Number
              </div>
              <div className="font-semibold text-white text-lg">{pop.number || '—'}</div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <div className="text-sm text-gray-400 mb-1 flex items-center">
                <span className="mr-2">💎</span>
                {getUserPurchasePrice(pop.id) ? 'Your Purchase Price' : 'Estimated Value'}
              </div>
              <div className="font-semibold text-white text-lg">
                {getUserPurchasePrice(pop.id) ? formatCurrency(getUserPurchasePrice(pop.id), currency) : (pop.estimated_value ? formatCurrency(pop.estimated_value, currency) : '—')}
              </div>
              {getUserPurchasePrice(pop.id) && (
                <div className="text-xs text-gray-400 mt-1">
                  Market pricing updates within 5 working days
                </div>
              )}
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <div className="text-sm text-gray-400 mb-1 flex items-center">
                <span className="mr-2">🎬</span>
                Fandom
              </div>
              <div className="font-semibold text-white text-lg">{pop.fandom || pop.series || '—'}</div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <div className="text-sm text-gray-400 mb-1 flex items-center">
                <span className="mr-2">🎭</span>
                Genre
              </div>
              <div className="font-semibold text-white text-lg">{pop.genre || '—'}</div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <div className="text-sm text-gray-400 mb-1 flex items-center">
                <span className="mr-2">🏷️</span>
                Edition
              </div>
              <div className="font-semibold text-white text-lg">{pop.edition || (pop.is_exclusive ? pop.exclusive_to || 'Exclusive' : '—')}</div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <div className="text-sm text-gray-400 mb-1 flex items-center">
                <span className="mr-2">🗓️</span>
                Release Year
              </div>
              <div className="font-semibold text-white text-lg">{pop.created_at ? new Date(pop.created_at).getFullYear() : '—'}</div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <div className="text-sm text-gray-400 mb-1 flex items-center">
                <span className="mr-2">🔒</span>
                Vaulted
              </div>
              <div className="font-semibold text-white text-lg">{pop.is_vaulted ? 'Yes' : 'No'}</div>
            </div>
            
            <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
              <div className="text-sm text-gray-400 mb-1 flex items-center">
                <span className="mr-2">👤</span>
                Owned
              </div>
              <div className={`font-semibold text-lg ${(pop.owned || ownedConfirmed) ? 'text-green-400' : 'text-white'}`}>
                {(pop.owned || ownedConfirmed) ? (ownedConfirmed ? '✅ Yes (Just Added!)' : '✅ Yes') : 'No'}
              </div>
            </div>
          </div>

          {/* Product Details - Protected Content */}
          {user ? (
            (pop.upc_a || pop.country_of_registration || pop.brand || pop.model_number || pop.size || pop.color || pop.weight || pop.product_dimensions) && (
              <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 mb-6">
                <h4 className="font-semibold mb-3 text-white text-lg">Product Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
                  {pop.upc_a && (
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-xs mb-1">UPC-A</span>
                      <span className="text-white font-medium">{pop.upc_a}</span>
                    </div>
                  )}
                  {pop.country_of_registration && (
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-xs mb-1">Country</span>
                      <span className="text-white font-medium">{pop.country_of_registration}</span>
                    </div>
                  )}
                  {pop.brand && (
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-xs mb-1">Brand</span>
                      <span className="text-white font-medium">{pop.brand}</span>
                    </div>
                  )}
                  {pop.model_number && (
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-xs mb-1">Model #</span>
                      <span className="text-white font-medium">{pop.model_number}</span>
                    </div>
                  )}
                  {pop.size && (
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-xs mb-1">Size</span>
                      <span className="text-white font-medium">{pop.size}</span>
                    </div>
                  )}
                  {pop.color && (
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-xs mb-1">Color</span>
                      <span className="text-white font-medium">{pop.color}</span>
                    </div>
                  )}
                  {pop.weight && (
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-xs mb-1">Weight</span>
                      <span className="text-white font-medium">{pop.weight}</span>
                    </div>
                  )}
                  {pop.product_dimensions && (
                    <div className="flex flex-col">
                      <span className="text-gray-400 text-xs mb-1">Dimensions</span>
                      <span className="text-white font-medium">{pop.product_dimensions}</span>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-600 mb-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-orange-500/20 rounded-full">
                  <User className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-white text-lg">Product Details</h4>
                  <p className="text-gray-400 mb-4">Access detailed product information including UPC codes, dimensions, and more.</p>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={() => navigate('/auth')}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Sign In
                    </Button>
                    <Button 
                      onClick={() => navigate('/auth')}
                      variant="outline"
                      className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white"
                    >
                      Join Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Additional Details - Protected Content */}
          {user ? (
            (pop.variant || pop.is_exclusive || pop.is_chase) && (
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 mb-6">
                <h4 className="font-semibold mb-3 text-white text-lg">Additional Details</h4>
                <div className="space-y-2 text-sm">
                  {pop.variant && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Variant:</span>
                      <span className="text-white">{pop.variant}</span>
                    </div>
                  )}
                  {pop.is_exclusive && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Exclusive to:</span>
                      <span className="text-white">{pop.exclusive_to || 'Yes'}</span>
                    </div>
                  )}
                  {pop.is_chase && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Chase:</span>
                      <span className="text-yellow-400">Yes</span>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-600 mb-6 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-orange-500/20 rounded-full">
                  <Sparkles className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-white text-lg">Additional Details</h4>
                  <p className="text-gray-400 mb-4">View variant information, exclusivity details, and chase status.</p>
                  <div className="flex gap-3 justify-center">
                    <Button 
                      onClick={() => navigate('/auth')}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      Sign In
                    </Button>
                    <Button 
                      onClick={() => navigate('/auth')}
                      variant="outline"
                      className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white"
                    >
                      Join Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Price History - Protected Content */}
          <div className="border-t border-gray-600 pt-6">
            {user ? (
              <PriceHistory 
                funkoPopId={pop.id} 
                funkoPop={{
                  id: pop.id,
                  name: pop.name,
                  series: pop.series,
                  number: pop.number,
                  image_url: getPrimaryImageUrl(pop),
                  estimated_value: getUserPurchasePrice(pop.id) || pop.estimated_value
                }}
              />
            ) : (
              <div className="bg-gray-700/50 p-6 rounded-lg border border-gray-600 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-3 bg-orange-500/20 rounded-full">
                    <Package className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-white text-lg">Price History & Analytics</h4>
                    <p className="text-gray-400 mb-4">Track price changes, view detailed analytics, and get market insights.</p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        onClick={() => navigate('/auth')}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        Sign In
                      </Button>
                      <Button 
                        onClick={() => navigate('/auth')}
                        variant="outline"
                        className="border-orange-500 text-orange-400 hover:bg-orange-500 hover:text-white"
                      >
                        Join Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );

  // Filter UI
  const renderFilterSection = () => (
    <aside className="bg-gray-900 border border-gray-700 rounded-lg p-6 sticky top-24 max-h-[80vh] overflow-y-auto min-w-[220px]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white">Filters</h2>
        <Button size="icon" variant="ghost" onClick={() => setFilterOpen(false)} className="md:hidden"><X /></Button>
      </div>
      <div className="mb-4 text-center">
        <a href="/sticker-guide" className="text-orange-400 underline text-sm">Need help understanding stickers?</a>
      </div>
      {Object.entries(FILTERS).map(([key, options]) => (
        key !== 'vaulted' ? (
          <div key={key} className="mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between text-white border-gray-600 hover:bg-gray-700 hover:text-white">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                  <Filter className="ml-2 w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 max-h-72 overflow-y-auto bg-gray-800 border-gray-700">
                <div className="p-2">
                  <Input
                    placeholder={`Search ${key}...`}
                    className="mb-2 bg-gray-700 border-gray-600 text-white"
                    onChange={e => setFilters(f => ({ ...f, [`${key}Search`]: e.target.value }))}
                    value={filters[`${key}Search`] || ''}
                  />
                </div>
                {options.filter(opt => !filters[`${key}Search`] || opt.toLowerCase().includes(filters[`${key}Search`].toLowerCase())).map(opt => (
                  <div key={opt} className="flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors text-white hover:text-[#e46c1b] hover:bg-gray-700" onClick={() => {
                    setFilters(f => {
                      const arr = (Array.isArray(f[key]) ? f[key] : []).includes(opt) ? f[key].filter(x => x !== opt) : [...f[key], opt];
                      return { ...f, [key]: arr };
                    });
                  }}>
                    <input type="checkbox" checked={(Array.isArray(filters[key]) ? filters[key] : []).includes(opt)} readOnly className="mr-2 accent-[#232837] border-[#232837]" style={{ borderColor: '#232837' }} />
                    <span className="font-medium text-sm flex-1 truncate">{opt}</span>
                    <span className="text-gray-400 font-bold text-sm ml-2">
                      ({key === 'edition' && opt === 'New Releases' 
                        ? allPops.filter(pop => pop.data_sources && pop.data_sources.includes('new-releases')).length 
                        : key === 'status' 
                        ? (() => {
                            switch (opt) {
                              case 'All': return allPops.length;
                              case 'Coming Soon': return allPops.filter(pop => pop.status === 'Coming Soon' || (pop.data_sources && pop.data_sources.includes('coming-soon'))).length;
                              case 'New Releases': return allPops.filter(pop => {
                                const releaseDate = new Date(pop.created_at);
                                const threeMonthsAgo = new Date();
                                threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
                                return (pop.data_sources && pop.data_sources.includes('new-releases')) || (releaseDate >= threeMonthsAgo && !pop.is_vaulted);
                              }).length;
                              case 'Funko Exclusive': return allPops.filter(pop => pop.edition && pop.edition.toLowerCase().includes('exclusive') || pop.fandom && pop.fandom.toLowerCase().includes('funko') || pop.category && pop.category.toLowerCase().includes('exclusive')).length;
                              case 'Pre-Order': return allPops.filter(pop => pop.status === 'Pre-Order' || pop.edition && pop.edition.toLowerCase().includes('pre-order')).length;
                              case 'In Stock': return allPops.filter(pop => !pop.is_vaulted && pop.status !== 'Sold Out' && pop.status !== 'Coming Soon').length;
                              case 'Sold Out': return allPops.filter(pop => pop.is_vaulted || pop.status === 'Sold Out').length;
                              default: return 0;
                            }
                          })()
                        : allPops.filter(pop => pop[key] === opt).length})
                    </span>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : null
      ))}
      {/* Vaulted filter */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 font-semibold mb-2 uppercase">Vaulted</div>
        <div className="flex gap-2">
          {FILTERS.vaulted.map(opt => (
            <Button
              key={opt}
              size="sm"
              variant={filters.vaulted === opt ? 'default' : 'outline'}
              className={filters.vaulted === opt ? 'bg-orange-500 text-white' : 'text-white border-gray-600 hover:bg-gray-700 hover:text-white'}
              onClick={() => setFilters(f => ({ ...f, vaulted: opt }))}
            >
              {opt}
            </Button>
          ))}
        </div>
      </div>
      {/* Release year filter */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 font-semibold mb-2 uppercase">Release Year</div>
        <select
          className="bg-gray-800 border border-gray-700 text-white rounded px-3 py-2 w-full"
          value={filters.year}
          onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}
        >
          <option value="">All</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </aside>
  );

  return (
    <>
      <SEO title="All Funko Pops | PopGuide" description="Browse the entire Funko Pop database with powerful filters and infinite scroll." />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col">
        <DashboardHeader 
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search entire Funko database..."
          showSearch={true}
          searchMode="database"
        />
        
        {/* Header with count */}
        <div className="container mx-auto px-4 pt-8 pb-4">
          {/* Breadcrumb */}
          <nav className="flex items-center text-sm mb-6 px-4 py-2 rounded-lg bg-gray-900/80 border-l-4 border-orange-500 shadow-md" aria-label="Breadcrumb">
            <Link to="/" className="hover:text-orange-400 font-semibold transition-colors">Home</Link>
            <span className="mx-1 text-orange-400">/</span>
            <Link to="/database" className="text-orange-400 font-bold tracking-wide uppercase hover:underline">Database</Link>
            <span className="mx-1 text-orange-400">/</span>
            <span className="text-orange-400 font-bold tracking-wide uppercase">All</span>
          </nav>
          {/* Title & Description */}
          <div className="mb-6 text-left">
            <h1 className="text-4xl font-bold mb-2">Browse Database</h1>
            <p className="text-lg text-gray-200 max-w-2xl mb-2">Explore our comprehensive collection of Funko Pops. Browse by genre, search for specific items, or discover new additions to your collection.</p>
            {searchTerm && (
              <p className="text-sm text-gray-400 mt-2">
                Showing {filteredPops.length.toLocaleString()} results for "{searchTerm}"
              </p>
            )}
          </div>
        </div>

        <div className="container mx-auto flex flex-col md:flex-row gap-8 pb-12 px-4 flex-1">
          {/* Filter sidebar (desktop) or drawer (mobile) */}
          <div className="hidden md:block w-64 flex-shrink-0">{renderFilterSection()}</div>
          <div className="md:hidden flex justify-end mb-4">
            <Button variant="outline" onClick={() => setFilterOpen(true)}><Filter className="mr-2" />Filters</Button>
          </div>
          {filterOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 flex">
              <div className="w-72 bg-gray-900 border-r border-gray-700 p-4 overflow-y-auto">{renderFilterSection()}</div>
              <div className="flex-1" onClick={() => setFilterOpen(false)} />
            </div>
          )}
          {/* Pop grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="text-gray-300">Loading...</div>
            ) : (
              <div className="space-y-6">
                {/* Expanded items rendered first */}
                {filteredPops.slice(0, visibleCount).map((pop, index) => {
                  const isExpanded = expandedPop?.id === pop.id;
                  
                  // If this pop is expanded, render it full width
                  if (isExpanded) {
                    return (
                      <div key={pop.id} className="w-full">
                        {/* Compact card for expanded item */}
                        <Card 
                          className="bg-gray-800/70 border border-gray-700 rounded-lg p-4 flex flex-row items-center hover:shadow-lg transition cursor-pointer mb-4" 
                          onClick={() => handleExpandPop(pop)}
                        >
                          <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden mr-4 flex-shrink-0">
                            {getPrimaryImageUrl(pop) ? (
                              <img src={getPrimaryImageUrl(pop)} alt={pop.name} className="w-full h-full object-contain" />
                            ) : (
                              <User className="w-8 h-8 text-orange-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-lg truncate">{pop.name}</div>
                            <div className="text-sm text-gray-400">{pop.series} {pop.number ? `#${pop.number}` : ''}</div>
                            <div className="text-sm text-orange-400 font-bold">{typeof pop.estimated_value === 'number' ? `£${pop.estimated_value.toFixed(2)}` : 'Pending'}</div>
                          </div>
                          <div className="flex items-center text-gray-400 text-sm">
                            <ChevronUp className="w-4 h-4 mr-1" />
                            <span>Hide Details</span>
                          </div>
                        </Card>

                        {/* Full width expanded details */}
                        {renderCard(pop, index)}
                      </div>
                    );
                  }
                  
                  // Skip non-expanded items here
                  return null;
                })}
                
                {/* Regular grid for non-expanded items */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {filteredPops.slice(0, visibleCount).map((pop, index) => {
                    const isExpanded = expandedPop?.id === pop.id;
                    const badges = getProductBadges(pop);
                    
                    // Skip expanded items (they're rendered above)
                    if (isExpanded) return null;
                    
                    return (
                      <Card 
                        key={pop.id}
                        className="bg-gray-800/70 border border-gray-700 rounded-lg p-3 flex flex-col items-center hover:shadow-lg transition cursor-pointer" 
                        onClick={() => handleExpandPop(pop)}
                      >
                        <div className="w-full aspect-square bg-gray-700 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
                          {getPrimaryImageUrl(pop) ? (
                            <img src={getPrimaryImageUrl(pop)} alt={pop.name} className="w-full h-full object-contain" />
                          ) : (
                            <User className="w-16 h-16 text-orange-400 animate-pulse" />
                          )}
                        </div>
                        
                        {/* Product Badges */}
                        {badges.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2 w-full justify-center">
                            {badges.slice(0, 2).map((badge, idx) => {
                              const IconComponent = badge.icon;
                              return (
                                <Badge key={idx} className={`text-xs ${badge.className}`}>
                                  <IconComponent className="w-3 h-3 mr-1" />
                                  {badge.text}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        
                        <div className="font-semibold text-white text-center text-base mb-1 truncate w-full">{pop.name}</div>
                        <div className="text-xs text-gray-400 mb-1">Character: {pop.name}</div>
                        <div className="text-xs text-gray-400 mb-1">Series: {pop.series}</div>
                        <div className="text-xs text-gray-400 mb-1">{pop.series} {pop.number ? `#${pop.number}` : ''}</div>
                        <div className="text-xs text-gray-400 mb-1">{pop.fandom}</div>
                        <div className="text-xs text-gray-400 mb-1">{pop.genre}</div>
                        <div className="text-xs text-gray-400 mb-1">{pop.edition}</div>
                        <div className="text-xs text-gray-400 mb-1">{pop.created_at ? new Date(pop.created_at).getFullYear() : '—'}{pop.is_vaulted ? ' • Vaulted' : ''}</div>
                        <div className="text-xs text-orange-400 font-bold mb-2">
                          {getUserPurchasePrice(pop.id) ? (
                            <>
                              {formatCurrency(getUserPurchasePrice(pop.id), currency)} <span className="text-gray-400">(Your Price)</span>
                            </>
                          ) : (
                            typeof pop.estimated_value === 'number' ? formatCurrency(pop.estimated_value, currency) : 'Pending'
                          )}
                        </div>
                        {pop.description && <div className="text-xs text-gray-300 mb-2 line-clamp-3">{pop.description}</div>}
                        
                        <Button 
                          variant="default"
                          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white w-full mt-auto py-2 px-4 rounded-lg font-semibold transform transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 border-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExpandPop(pop);
                          }}
                        >
                          <ChevronDown className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
            <div ref={loader} />
          </div>
        </div>
        <Footer />
      </div>

      {/* Custom Lists Modal */}
      {listModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add to List</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Choose a list for "{selectedPopForList?.name}"</p>
            
            {/* Existing Lists */}
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {lists.length > 0 ? (
                lists.map((list) => (
                  <Button
                    key={list.id}
                    variant="outline"
                    className="w-full justify-between border-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gradient-to-r hover:from-orange-500 hover:to-orange-600 hover:text-white hover:border-orange-500 transition-all duration-200 p-4 h-auto bg-white dark:bg-gray-700 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25"
                    onClick={() => handleListSelect(list.id)}
                    disabled={addingToListId === list.id}
                  >
                    <div className="flex items-center">
                      {addingToListId === list.id ? (
                        <Loader2 className="w-5 h-5 mr-3 animate-spin text-orange-500" />
                      ) : (
                        <List className="w-5 h-5 mr-3 text-orange-500" />
                      )}
                      <span className="text-left font-medium text-gray-900 dark:text-white">{list.name}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </Button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <List className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No custom lists yet</p>
                  <p className="text-sm">Create your first list below</p>
                </div>
              )}
            </div>

            {/* Create New List */}
            <div className="border-t border-gray-300 dark:border-gray-600 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create New List</h4>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter list name..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-orange-500 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                />
                <Button
                  onClick={handleCreateList}
                  disabled={!newListName.trim() || creatingList}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white flex-shrink-0 px-6 shadow-lg shadow-orange-500/25 border-0 font-semibold transform transition-all duration-200 hover:scale-105"
                >
                  {creatingList ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Close Button */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
              <Button
                variant="outline"
                onClick={() => {
                  setListModalOpen(false);
                  setSelectedPopForList(null);
                  setAddingToListId(null);
                  setNewListName("");
                }}
                className="border-2 border-gray-400 dark:border-gray-500 text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white transition-all duration-200 px-6 font-semibold transform hover:scale-105"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DirectoryAll; 