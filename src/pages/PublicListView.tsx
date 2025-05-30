import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Share2, ArrowLeft, Eye, Calendar } from "lucide-react";
import { useListById } from "@/hooks/useCustomLists";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import MobileBottomNav from '@/components/MobileBottomNav';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const PublicListView = () => {
  const { listId } = useParams<{ listId: string }>();
  const { toast } = useToast();
  const { data: list, isLoading } = useListById(listId || '');
  const { user } = useAuth();
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const isOwner = user && list && user.id === list.user_id;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "The list share link has been copied to your clipboard",
    });
  };

  const calculateListValue = () => {
    if (!list?.list_items) return 0;
    return list.list_items.reduce((total, item) => {
      return total + (item.funko_pops?.estimated_value || 0);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!list || !list.is_public) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">List Not Found</h1>
            <p className="text-gray-400 mb-6">This list doesn't exist or is not public.</p>
            <Link to="/browse-lists">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Browse Public Lists
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8">
        {/* Logo Header */}
        <div className="text-center mb-6">
          <img src="https://Maintainhq-pull-zone.b-cdn.net/02_the_pop_guide/pop-guide-logo-trans-white.svg" alt="PopGuide Logo" className="h-16 mx-auto mb-4" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/browse-lists">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleShare}
            className="border-gray-600 text-white hover:bg-gray-800 hover:text-[#232837] focus:text-[#232837] active:text-[#232837]"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share List
          </Button>
        </div>

        {/* List Header */}
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{list.name}</h1>
                {list.description && (
                  <p className="text-gray-400 text-lg">{list.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                  <Eye className="w-3 h-3 mr-1" />
                  Public
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800 p-4 rounded">
                <p className="text-2xl font-bold text-orange-500">{list.list_items?.length || 0}</p>
                <p className="text-gray-400">Items</p>
              </div>
              <div className="bg-gray-800 p-4 rounded">
                <p className="text-2xl font-bold text-green-500">${calculateListValue().toFixed(2)}</p>
                <p className="text-gray-400">Est. Value</p>
              </div>
              <div className="bg-gray-800 p-4 rounded">
                <p className="text-lg font-semibold text-blue-400">{(list as any).profiles?.full_name || 'Anonymous'}</p>
                <p className="text-gray-400">Creator</p>
              </div>
              <div className="bg-gray-800 p-4 rounded">
                <p className="text-sm text-gray-300 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(list.created_at).toLocaleDateString()}
                </p>
                <p className="text-gray-400">Created</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List Items */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-white">Items in this List</h2>
          
          {!list.list_items || list.list_items.length === 0 ? (
            <Card className="bg-gray-800/30 border-gray-700">
              <CardContent className="text-center py-8">
                <p className="text-gray-400">This list is empty.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {list.list_items.map((item) => (
                <Card key={item.id} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors">
                  <CardContent className="p-4">
                    {item.funko_pops?.image_url && (
                      <img 
                        src={item.funko_pops.image_url} 
                        alt={item.funko_pops.name}
                        className="w-full h-48 object-cover rounded mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-white mb-1 line-clamp-2">
                      {item.funko_pops?.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">{item.funko_pops?.series}</p>
                    
                    <div className="flex items-center justify-between mt-3">
                      {item.funko_pops?.number && (
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          #{item.funko_pops.number}
                        </Badge>
                      )}
                      {item.funko_pops?.estimated_value && (
                        <Badge className="bg-green-500/20 text-green-400">
                          ${item.funko_pops.estimated_value}
                        </Badge>
                      )}
                    </div>

                    {(item.funko_pops?.is_chase || item.funko_pops?.is_exclusive || item.funko_pops?.is_vaulted) && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.funko_pops.is_chase && (
                          <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 text-xs">
                            Chase
                          </Badge>
                        )}
                        {item.funko_pops.is_exclusive && (
                          <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 text-xs">
                            Exclusive
                          </Badge>
                        )}
                        {item.funko_pops.is_vaulted && (
                          <Badge variant="secondary" className="bg-red-500/20 text-red-400 text-xs">
                            Vaulted
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <MobileBottomNav />
      {!isOwner && (
        <div className="fixed bottom-6 right-6 z-50">
          <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-lg">I've purchased this list, request transfer to me</Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Request List Transfer</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p>Are you sure you want to request this list be transferred to your account? The owner will be notified and must approve the transfer.</p>
                <Button className="bg-orange-500 hover:bg-orange-600 w-full" onClick={async () => {
                  if (!user) {
                    toast({ title: 'You must be logged in', description: 'Please log in to request a transfer.', variant: 'destructive' });
                    return;
                  }
                  if (!list || !list.user_id) {
                    toast({ title: 'Error', description: 'List owner not found.', variant: 'destructive' });
                    return;
                  }
                  try {
                    // Create transfer request
                    const { error: transferError } = await supabase
                      .from('list_transfers')
                      .insert({
                        list_id: list.id,
                        from_user_id: list.user_id,
                        to_user_id: user.id,
                        status: 'pending',
                      });
                    if (transferError) throw transferError;
                    // Create notification for owner
                    await supabase.from('notifications').insert({
                      user_id: list.user_id,
                      type: 'list_transfer',
                      message: `${user.email || 'A user'} has requested to transfer your list '${list.name}'.`,
                      data: { list_id: list.id, requester_id: user.id },
                    });
                    // Optionally, send email (if you have a utility)
                    // await sendListTransferEmail(list.user_id, user.email, list.name);
                    setTransferDialogOpen(false);
                    toast({ title: 'Request sent!', description: 'The list owner has been notified.' });
                  } catch (err: any) {
                    toast({ title: 'Error', description: err.message || 'Failed to request transfer.', variant: 'destructive' });
                  }
                }}>Send Request</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default PublicListView;
