import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import PlatformLogo from '@/components/PlatformLogo';
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: 'موفقیت', description: 'با موفقیت وارد شدید' });
      navigate('/dashboard');
    } catch (error: any) {
      toast({ title: 'خطا', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'demo@hireflow.app',
        password: 'Demo123!'
      });
      if (error) throw error;
      toast({ title: 'موفقیت', description: 'با حساب آزمایشی وارد شدید' });

      sessionStorage.setItem('demo-reset-in-progress', 'true');
      navigate('/dashboard');

      if (data.session) {
        toast({ title: 'به‌روزرسانی داده‌های آزمایشی', description: 'در حال آماده‌سازی محیط آزمایشی شما...' });
        supabase.functions.invoke('reset-demo-data', {
          headers: { Authorization: `Bearer ${data.session.access_token}` }
        }).then(() => {
          sessionStorage.removeItem('demo-reset-in-progress');
          toast({ title: 'داده‌های آزمایشی آماده شد', description: 'محیط آزمایشی شما آماده است' });
          window.dispatchEvent(new Event('demo-data-refreshed'));
        }).catch(resetError => {
          sessionStorage.removeItem('demo-reset-in-progress');
          console.error('Error resetting demo data:', resetError);
          toast({ title: 'به‌روزرسانی داده‌های آزمایشی ناموفق بود', description: 'می‌توانید از داده‌های موجود استفاده کنید', variant: 'destructive' });
        });
      }
    } catch (error: any) {
      toast({ title: 'خطا', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <PlatformLogo />
          </div>
          
          <CardDescription className="text-center">
            برای ورود به حساب کاربری خود اقدام کنید
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <Input id="password" type="password" placeholder="رمز عبور خود را وارد کنید" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'در حال ورود...' : 'ورود'}
            </Button>
          </form>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">یا</span>
            </div>
          </div>

          <Button type="button" variant="secondary" className="w-full" onClick={handleDemoLogin} disabled={loading}>
            ورود به نسخه آزمایشی
          </Button>

          <div className="mt-4 text-center text-sm">
            حساب کاربری ندارید؟{' '}
            <Link to="/auth/signup" className="text-primary hover:underline">
              ثبت‌نام کنید
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Login;
