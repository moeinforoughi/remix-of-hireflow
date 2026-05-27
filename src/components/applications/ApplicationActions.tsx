import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { UserX, UserCheck, UserMinus } from 'lucide-react';
import { ردDialog } from './ردDialog';
import { پس گرفتنDialog } from './پس گرفتنDialog';
import { استخدامDialog } from './استخدامDialog';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

interface ApplicationActionsProps {
  applicationState: string;
  onرد: (reason: string, note: string) => void;
  onپس گرفتن: () => void;
  onاستخدام: () => void;
  offerState?: string;
  applicationId?: string;
}

export const ApplicationActions = ({
  applicationState,
  onرد,
  onپس گرفتن,
  onاستخدام,
  offerState,
  applicationId,
}: ApplicationActionsProps) => {
  const [rejectباز, setردباز] = useState(false);
  const [withdrawباز, setپس گرفتنباز] = useState(false);
  const [hireباز, setاستخدامباز] = useState(false);
  const [offerId, setOfferId] = useState<string | null>(null);

  useEffect(() => {
    if (applicationId && offerState === 'accepted') {
      fetchOfferId();
    }
  }, [applicationId, offerState]);

  const fetchOfferId = async () => {
    if (!applicationId) return;

    try {
      const { data, error } = await supabase
        .from('offers')
        .select('id')
        .eq('application_id', applicationId)
        .single();

      if (error) throw error;
      setOfferId(data?.id || null);
    } catch (error) {
      console.error('Error fetching offer:', error);
    }
  };

  if (applicationState !== 'active') {
    return null;
  }

  // If offer is accepted, show different actions
  if (offerState === 'accepted') {
    return (
      <div className="flex gap-2">
        <Button onClick={onاستخدام} variant="default">
          Mark as استخدامd
        </Button>
        {offerId && (
          <Button asChild variant="outline">
            <Link to={`/offers/${offerId}`}>
              View Offer
            </Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setردباز(true)}
        >
          <UserX className="h-4 w-4 mr-2" />
          رد
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setپس گرفتنباز(true)}
        >
          <UserMinus className="h-4 w-4 mr-2" />
          پس گرفتن
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => setاستخدامباز(true)}
        >
          <UserCheck className="h-4 w-4 mr-2" />
          استخدام
        </Button>
      </div>

      <ردDialog
        open={rejectباز}
        onبازChange={setردباز}
        onتأیید={(reason, note) => {
          onرد(reason, note);
          setردباز(false);
        }}
      />

      <پس گرفتنDialog
        open={withdrawباز}
        onبازChange={setپس گرفتنباز}
        onتأیید={() => {
          onپس گرفتن();
          setپس گرفتنباز(false);
        }}
      />

      <استخدامDialog
        open={hireباز}
        onبازChange={setاستخدامباز}
        onتأیید={() => {
          onاستخدام();
          setاستخدامباز(false);
        }}
      />
    </>
  );
};
