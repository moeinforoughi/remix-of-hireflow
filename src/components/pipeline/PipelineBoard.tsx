// پایپ‌لاین Board Component - به‌روزرسانیd Design
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useگیرندهast } from '@/hooks/use-toast';
import { Loader2, ChevronRight, Pencil, X, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDistanceگیرندهخیرw } from 'date-fns';
import { BulkردDialog } from '@/components/pipeline/BulkردDialog';
import { useUserدسترسی‌ها } from '@/hooks/useUserدسترسی‌ها';
import { Alert, Alertتوضیحات } from '@/components/ui/alert';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragشروعEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverEvent,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core';
import { مرتب‌سازیableContext, verticalListمرتب‌سازیingStrategy } from '@dnd-kit/sortable';
import { useمرتب‌سازیable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface مرحله {
  id: string;
  name: string;
  order_idx: number;
  type: string;
}

interface ApplicationCard {
  id: string;
  candidate: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
    location?: string | null;
  } | null;
  applied_at: string;
  current_stage_id: string | null;
}

interface پایپ‌لاینBoardProps {
  jobId: string;
}

interface مرتب‌سازیableApplicationProps {
  application: ApplicationCard;
  onClick: () => void;
  isانتخابed: boolean;
  onگیرندهggleانتخاب: (id: string) => void;
}

const getمرحلهColor = (index: number) => {
  const colors = [
    'bg-orange-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
  ];
  return colors[index % colors.length];
};

const مرتب‌سازیableApplication = ({ application, onClick, isانتخابed, onگیرندهggleانتخاب }: مرتب‌سازیableApplicationProps) => {
  const {
    attributes,
    listeners,
    setخیرdeRef,
    transform,
    transition,
    isDragging,
  } = useمرتب‌سازیable({ id: application.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Safety check - should not render if candidate is null (filtered in fetchپایپ‌لاینData)
  if (!application.candidate) {
    return null;
  }

  return (
    <div ref={setخیرdeRef} style={style} {...attributes} {...listeners}>
      <div 
        className={`bg-card rounded-lg border border-border p-4 cursor-pointer hover:shadow-md transition-all mb-3 ${isانتخابed ? 'ring-2 ring-primary' : ''}`}
        onClick={(e) => {
          if (e.shiftKey || e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onگیرندهggleانتخاب(application.id);
          } else {
            onClick();
          }
        }}
      >
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage src={application.candidate.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {getInitials(application.candidate.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">{application.candidate.full_name}</p>
            <p className="text-sm text-muted-foreground">
              {application.candidate.location || 'مکان not specified'}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {formatDistanceگیرندهخیرw(new تاریخ(application.applied_at), { addSuffix: true })}
          </p>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

interface DroppableمرحلهProps {
  id: string;
  children: React.Reactخیرde;
  isOver: boolean;
  stage: مرحله;
  stageColor: string;
  candidateCount: number;
  onویرایشمرحله: () => void;
  isویرایشing: boolean;
  editingمرحلهName: string;
  onویرایشingNameChange: (value: string) => void;
  onذخیرهمرحله: () => void;
  onانصرافویرایش: () => void;
}

const Droppableمرحله = ({ 
  id, 
  children, 
  isOver, 
  stage, 
  stageColor, 
  candidateCount,
  onویرایشمرحله,
  isویرایشing,
  editingمرحلهName,
  onویرایشingNameChange,
  onذخیرهمرحله,
  onانصرافویرایش
}: DroppableمرحلهProps) => {
  const { setخیرdeRef } = useDroppable({ id });

  return (
    <div
      ref={setخیرdeRef}
      className={`min-h-[600px] rounded-lg border transition-colors bg-card overflow-hidden ${
        isOver ? 'border-primary' : 'border-border'
      }`}
    >
      {/* مرحله Header */}
      <div className="bg-muted/30 p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${stageColor}`}></div>
          {isویرایشing ? (
            <>
              <Input
                value={editingمرحلهName}
                onChange={(e) => onویرایشingNameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onذخیرهمرحله();
                  if (e.key === 'Escape') onانصرافویرایش();
                }}
                className="h-7 text-sm flex-1"
                autoFocus
              />
              <button 
                onClick={onذخیرهمرحله}
                className="p-1 hover:bg-green-100 rounded text-green-600"
                title="ذخیره"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button 
                onClick={onانصرافویرایش}
                className="p-1 hover:bg-red-100 rounded text-red-600"
                title="انصراف"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <h3 className="text-sm flex-1">{stage.name}</h3>
              <button 
                onClick={onویرایشمرحله}
                className="p-1 hover:bg-muted rounded"
                title="ویرایش stage name"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <span className="text-sm text-primary font-semibold">
                {candidateCount} candidate{candidateCount !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </div>
      
      {/* مرحله Content */}
      <div className="p-4 space-y-3">
        {children}
      </div>
    </div>
  );
};

const پایپ‌لاینBoard = ({ jobId }: پایپ‌لاینBoardProps) => {
  const [stages, setمرحلهs] = useState<مرحله[]>([]);
  const [applications, setدرخواست‌ها] = useState<ApplicationCard[]>([]);
  const [loading, setبارگذاری] = useState(true);
  const [activeId, setفعالId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollشروع, setScrollشروع] = useState({ x: 0, scrollLeft: 0 });
  const [editingمرحلهId, setویرایشingمرحلهId] = useState<string | null>(null);
  const [editingمرحلهName, setویرایشingمرحلهName] = useState('');
  const [selectedApplicationIds, setانتخابedApplicationIds] = useState<string[]>([]);
  const [showBulkردDialog, setنمایشBulkردDialog] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useگیرندهast();
  const navigate = useNavigate();
  const { canMoveپایپ‌لاین } = useUserدسترسی‌ها();
  const hasMovePermission = canMoveپایپ‌لاین(jobId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchپایپ‌لاینData();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('pipeline-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `job_id=eq.${jobId}`,
        },
        () => {
          fetchپایپ‌لاینData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates',
        },
        () => {
          fetchپایپ‌لاینData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const fetchپایپ‌لاینData = async () => {
    try {
      const [stagesRes, appsRes] = await Promise.all([
        supabase
          .from('job_stages')
          .select('*')
          .eq('job_id', jobId)
          .order('order_idx'),
        supabase
          .from('applications')
          .select(`
            id,
            applied_at,
            current_stage_id,
            candidate:candidates(id, full_name, email, location)
          `)
          .eq('job_id', jobId)
          .in('state', ['active', 'hired']),
      ]);

      if (stagesRes.error) throw stagesRes.error;
      if (appsRes.error) throw appsRes.error;

      setمرحلهs(stagesRes.data || []);
      // فیلتر out applications with null candidates
      setدرخواست‌ها((appsRes.data || []).filter(app => app.candidate !== null));
    } catch (error: any) {
      toast({
        title: 'Error loading pipeline',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setبارگذاری(false);
    }
  };

  const getدرخواست‌هاForمرحله = (stageId: string) => {
    return applications.filter((app) => app.current_stage_id === stageId);
  };

  const handleDragشروع = (event: DragشروعEvent) => {
    setفعالId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    setOverId(over ? over.id as string : null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setفعالId(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    // Check permission before moving
    if (!hasMovePermission) {
      toast({
        title: 'Permission denied',
        description: 'You do not have permission to move candidates in the pipeline',
        variant: 'destructive',
      });
      return;
    }

    const applicationId = active.id as string;
    const newمرحلهId = over.id as string;

    // Check if dropping on a stage
    const isمرحله = stages.some((s) => s.id === newمرحلهId);
    if (!isمرحله) return;

    try {
      const { error } = await supabase
        .from('applications')
        .update({ current_stage_id: newمرحلهId })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: 'Application moved',
        description: 'Successfully moved to new stage',
      });

      fetchپایپ‌لاینData();
    } catch (error: any) {
      toast({
        title: 'Error moving application',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsScrolling(true);
    setScrollشروع({
      x: e.pageX - scrollContainerRef.current.offsetLeft,
      scrollLeft: scrollContainerRef.current.scrollLeft,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isScrolling || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - scrollشروع.x) * 2; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollشروع.scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsScrolling(false);
  };

  const handleMouseLeave = () => {
    setIsScrolling(false);
  };

  const handleشروعویرایشمرحله = (stage: مرحله) => {
    setویرایشingمرحلهId(stage.id);
    setویرایشingمرحلهName(stage.name);
  };

  const handleذخیرهمرحله = async (stageId: string) => {
    if (!editingمرحلهName.trim()) {
      toast({
        title: 'خطا',
        description: 'مرحله name cannot be empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('job_stages')
        .update({ name: editingمرحلهName })
        .eq('id', stageId);

      if (error) throw error;

      toast({
        title: 'مرحله updated',
        description: 'مرحله name has been updated successfully',
      });

      setویرایشingمرحلهId(null);
      setویرایشingمرحلهName('');
      fetchپایپ‌لاینData();
    } catch (error: any) {
      toast({
        title: 'Error updating stage',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleانصرافویرایش = () => {
    setویرایشingمرحلهId(null);
    setویرایشingمرحلهName('');
  };

  const handleگیرندهggleانتخاب = (id: string) => {
    setانتخابedApplicationIds((prev) =>
      prev.includes(id) ? prev.filter((appId) => appId !== id) : [...prev, id]
    );
  };

  const handleBulkمرحلهChange = async (newمرحلهId: string) => {
    if (selectedApplicationIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('applications')
        .update({ current_stage_id: newمرحلهId })
        .in('id', selectedApplicationIds);

      if (error) throw error;

      toast({
        title: 'درخواست‌ها moved',
        description: `Successfully moved ${selectedApplicationIds.length} candidate${selectedApplicationIds.length !== 1 ? 's' : ''} to new stage`,
      });

      setانتخابedApplicationIds([]);
      fetchپایپ‌لاینData();
    } catch (error: any) {
      toast({
        title: 'Error moving applications',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleBulkرد = async (reason: string, note: string) => {
    if (selectedApplicationIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('applications')
        .update({ 
          state: 'rejected',
          rejection_reason: reason,
          rejection_note: note
        })
        .in('id', selectedApplicationIds);

      if (error) throw error;

      toast({
        title: 'درخواست‌ها rejected',
        description: `Successfully rejected ${selectedApplicationIds.length} candidate${selectedApplicationIds.length !== 1 ? 's' : ''}`,
      });

      setانتخابedApplicationIds([]);
      setنمایشBulkردDialog(false);
      fetchپایپ‌لاینData();
    } catch (error: any) {
      toast({
        title: 'Error rejecting applications',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const activeApplication = applications.find((app) => app.id === activeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hasMovePermission && (
        <Alert>
          <Lock className="h-4 w-4" />
          <Alertتوضیحات>
            You have view-only access to this pipeline. Contact your administrator to request move permissions.
          </Alertتوضیحات>
        </Alert>
      )}
      
      {selectedApplicationIds.length > 0 && hasMovePermission && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <p className="font-medium">
                  {selectedApplicationIds.length} candidate{selectedApplicationIds.length !== 1 ? 's' : ''} selected
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setانتخابedApplicationIds([])}
                >
                  <X className="h-4 w-4 mr-1" />
                  پاک کردن
                </Button>
              </div>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button>Move to مرحله</Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">انتخاب stage</p>
                      {stages.map((stage, index) => (
                        <Button
                          key={stage.id}
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => handleBulkمرحلهChange(stage.id)}
                        >
                          <div className={`w-2 h-2 rounded-full ${getمرحلهColor(index)} mr-2`} />
                          {stage.name}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  variant="destructive" 
                  onClick={() => setنمایشBulkردDialog(true)}
                >
                  رد انتخابed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragشروع={handleDragشروع}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Horizontal scroll container with drag-to-scroll */}
        <div 
          ref={scrollContainerRef}
          className={`overflow-x-auto pb-4 ${isScrolling ? 'cursor-grabbing' : 'cursor-grab'} select-none`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        >
          <div className="flex gap-6 min-w-max">
            {stages.map((stage, index) => {
              const stageدرخواست‌ها = getدرخواست‌هاForمرحله(stage.id);
              const stageColor = getمرحلهColor(index);
              
              return (
                <div
                  key={stage.id}
                  className="w-[320px] flex-shrink-0"
                >
                  <مرتب‌سازیableContext
                    id={stage.id}
                    items={stageدرخواست‌ها.map((a) => a.id)}
                    strategy={verticalListمرتب‌سازیingStrategy}
                  >
                    <Droppableمرحله 
                      id={stage.id} 
                      isOver={overId === stage.id}
                      stage={stage}
                      stageColor={stageColor}
                      candidateCount={stageدرخواست‌ها.length}
                      onویرایشمرحله={() => handleشروعویرایشمرحله(stage)}
                      isویرایشing={editingمرحلهId === stage.id}
                      editingمرحلهName={editingمرحلهName}
                      onویرایشingNameChange={setویرایشingمرحلهName}
                      onذخیرهمرحله={() => handleذخیرهمرحله(stage.id)}
                      onانصرافویرایش={handleانصرافویرایش}
                    >
                      {stageدرخواست‌ها.map((app) => (
                        <مرتب‌سازیableApplication
                          key={app.id}
                          application={app}
                          onClick={() => navigate(`/applications/${app.id}`)}
                          isانتخابed={selectedApplicationIds.includes(app.id)}
                          onگیرندهggleانتخاب={handleگیرندهggleانتخاب}
                        />
                      ))}
                      {stageدرخواست‌ها.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-xs text-muted-foreground">Drop candidates here</p>
                        </div>
                      )}
                    </Droppableمرحله>
                  </مرتب‌سازیableContext>
                </div>
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeApplication && (
            <Card className="shadow-lg rotate-3">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={activeApplication.candidate.avatar_url || undefined} />
                    <AvatarFallback>
                      {activeApplication.candidate.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{activeApplication.candidate.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {activeApplication.candidate.location || 'مکان not specified'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </DragOverlay>
      </DndContext>

      {applications.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              خیر active applications for this job yet
            </p>
          </CardContent>
        </Card>
      )}

      <BulkردDialog
        open={showBulkردDialog}
        onبازChange={setنمایشBulkردDialog}
        onتأیید={handleBulkرد}
        count={selectedApplicationIds.length}
      />
    </div>
  );
};

export default پایپ‌لاینBoard;
