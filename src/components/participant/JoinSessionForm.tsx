
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
  accessCode: z.string().length(6, {
    message: "Access code must be exactly 6 characters",
  }),
  userName: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface JoinSessionFormProps {
  initialCode?: string;
}

const JoinSessionForm: React.FC<JoinSessionFormProps> = ({ initialCode = '' }) => {
  const { joinSession } = useAppContext();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accessCode: initialCode,
      userName: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    joinSession(data.accessCode, data.userName || 'Anonymous');
  };

  return (
    <div className="max-w-md mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="accessCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Session Access Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter 6-digit access code"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Enter the 6-digit code provided by your session host
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter your name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full">
            Join Session
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default JoinSessionForm;
