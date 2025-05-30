import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Scan, Upload, Heart, Plus, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAddToCollection, useFunkoPops, useUserCollection } from "@/hooks/useFunkoPops";
import { useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EnhancedAddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EnhancedAddItemDialog = ({ open, onOpenChange }: EnhancedAddItemDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("mint");
  const [purchasePrice, setPurchasePrice] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const addToCollection = useAddToCollection();
  const { addToWishlist, wishlist } = useWishlist();
  const { data: funkoPops = [] } = useFunkoPops();
  const { data: userCollection = [] } = useUserCollection(user?.id);

  // Manual entry state
  const [manualName, setManualName] = useState("");
  const [manualSeries, setManualSeries] = useState("");
  const [manualNumber, setManualNumber] = useState("");
  const [manualRarity, setManualRarity] = useState("");
  const [manualCondition, setManualCondition] = useState("mint");
  const [manualPrice, setManualPrice] = useState("");
  const [manualEan, setManualEan] = useState("");
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState("");

  // Helper to normalize strings for search (case-insensitive, ignore punctuation)
  function normalize(str: string) {
    return str.toLowerCase().replace(/[^a-z0-9]/gi, '');
  }

  const normalizedSearch = normalize(searchQuery);
  const searchResults =
    normalizedSearch.length > 1
      ? funkoPops.filter((pop) => {
          return (
            normalize(pop.name).includes(normalizedSearch) ||
            (pop.series && normalize(pop.series).includes(normalizedSearch)) ||
            (pop.number && normalize(pop.number).includes(normalizedSearch))
          );
        })
      : [];

  const isInWishlist = (id: string) => wishlist.some((item: any) => item.funko_pop_id === id);
  const isInCollection = (id: string) => userCollection.some((item: any) => item.funko_pop_id === id);

  const handleAddToCollection = async (item: any) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your collection",
        variant: "destructive",
      });
      return;
    }
    try {
      await addToCollection.mutateAsync({
        funkoPopId: item.id,
        userId: user.id,
        condition: selectedCondition,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding to collection:', error);
    }
  };

  const handleAddToWishlist = async (item: any) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your wishlist",
        variant: "destructive",
      });
      return;
    }
    try {
      await addToWishlist.mutateAsync({
        funkoPopId: item.id,
      });
    } catch (error) {
      console.error('Error adding to wishlist:', error);
    }
  };

  const handleManualAdd = async () => {
    setManualError("");
    if (!user) {
      setManualError("Sign in required");
      return;
    }
    if (!manualName || !manualSeries) {
      setManualError("Name and Series are required");
      return;
    }
    setManualLoading(true);
    try {
      // Insert new Pop
      const { data: pop, error } = await supabase
        .from('funko_pops')
        .insert({
          name: manualName,
          series: manualSeries,
          number: manualNumber,
          ean: manualEan || null,
          rarity: manualRarity || null,
        })
        .select()
        .single();
      if (error || !pop) throw error || new Error('Insert failed');
      // Add to collection
      await addToCollection.mutateAsync({
        funkoPopId: pop.id,
        userId: user.id,
        condition: manualCondition,
        purchasePrice: manualPrice ? parseFloat(manualPrice) : undefined,
      });
      setManualName(""); setManualSeries(""); setManualNumber(""); setManualRarity(""); setManualCondition("mint"); setManualPrice(""); setManualEan("");
      onOpenChange(false);
    } catch (err: any) {
      setManualError(err.message || 'Failed to add Pop');
    } finally {
      setManualLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Add to Collection</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="search" className="data-[state=active]:bg-orange-500">
              <Search className="w-4 h-4 mr-2" />
              Search Database
            </TabsTrigger>
            <TabsTrigger value="scan" className="data-[state=active]:bg-orange-500">
              <Scan className="w-4 h-4 mr-2" />
              Scan Barcode
            </TabsTrigger>
            <TabsTrigger value="manual" className="data-[state=active]:bg-orange-500">
              <Upload className="w-4 h-4 mr-2" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Funko Pop Database</Label>
              <Input
                id="search"
                placeholder="Enter name, series, or item number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-800 border-gray-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="mint">Mint</SelectItem>
                    <SelectItem value="near_mint">Near Mint</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price (Optional)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{item.name}</h4>
                    <p className="text-sm text-gray-400">{item.series} #{item.number}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {item.is_chase && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded">Chase</span>
                      )}
                      {item.is_exclusive && (
                        <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">Exclusive</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-orange-500 font-semibold mb-2">
                      ${item.value}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={isInWishlist(item.id) ? undefined : "outline"}
                        className={isInWishlist(item.id) ? "bg-pink-600 text-white hover:bg-pink-700" : "border-gray-600 hover:bg-gray-600"}
                        disabled={isInWishlist(item.id)}
                        onClick={() => handleAddToWishlist(item)}
                      >
                        {isInWishlist(item.id) ? <Check className="w-3 h-3 mr-1" /> : <Heart className="w-3 h-3 mr-1" />}
                        Wishlist
                      </Button>
                      <Button
                        size="sm"
                        variant={isInCollection(item.id) ? undefined : "outline"}
                        className={isInCollection(item.id) ? "bg-orange-500 text-white hover:bg-orange-600" : "border-gray-600 hover:bg-gray-600"}
                        disabled={isInCollection(item.id)}
                        onClick={() => handleAddToCollection(item)}
                      >
                        {isInCollection(item.id) ? <Check className="w-3 h-3 mr-1" /> : <Plus className="w-3 h-3 mr-1" />}
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="scan" className="space-y-4">
            <div className="text-center py-12">
              <Scan className="w-20 h-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-medium mb-3">Barcode Scanner</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Use your device's camera to scan the barcode on your Funko Pop box. This will automatically identify the item and add it to your collection.
              </p>
              <Button className="bg-orange-500 hover:bg-orange-600 text-lg px-8 py-3">
                <Scan className="w-5 h-5 mr-2" />
                Start Camera
              </Button>
              <p className="text-xs text-gray-500 mt-4">
                Camera access required. Works best with good lighting.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manualName">Name</Label>
                <Input id="manualName" value={manualName} onChange={e => setManualName(e.target.value)} placeholder="e.g., Spider-Man" className="bg-gray-800 border-gray-700" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualSeries">Series</Label>
                <Input id="manualSeries" value={manualSeries} onChange={e => setManualSeries(e.target.value)} placeholder="e.g., Marvel" className="bg-gray-800 border-gray-700" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualNumber">Item Number</Label>
                <Input id="manualNumber" value={manualNumber} onChange={e => setManualNumber(e.target.value)} placeholder="e.g., 593" className="bg-gray-800 border-gray-700" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualEan">EAN (Optional)</Label>
                <Input id="manualEan" value={manualEan} onChange={e => setManualEan(e.target.value)} placeholder="e.g., 889698123456" className="bg-gray-800 border-gray-700" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualRarity">Rarity</Label>
                <Select value={manualRarity} onValueChange={setManualRarity}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select rarity" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="common">Common</SelectItem>
                    <SelectItem value="rare">Rare</SelectItem>
                    <SelectItem value="chase">Chase</SelectItem>
                    <SelectItem value="exclusive">Exclusive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualCondition">Condition</Label>
                <Select value={manualCondition} onValueChange={setManualCondition}>
                  <SelectTrigger className="bg-gray-800 border-gray-700">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="mint">Mint</SelectItem>
                    <SelectItem value="near_mint">Near Mint</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manualPrice">Purchase Price</Label>
                <Input id="manualPrice" type="number" step="0.01" value={manualPrice} onChange={e => setManualPrice(e.target.value)} placeholder="0.00" className="bg-gray-800 border-gray-700" />
              </div>
            </div>
            {manualError && <div className="text-red-500 text-sm mt-2">{manualError}</div>}
            <div className="pt-4">
              <Button className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleManualAdd} disabled={manualLoading}>
                {manualLoading ? 'Adding...' : 'Add to Collection'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedAddItemDialog;
