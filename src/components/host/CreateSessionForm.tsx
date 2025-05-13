
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Session title must be at least 3 characters",
  }),
  pollFrequency: z.number().min(1).max(30),
  saveTranscript: z.boolean(),
  participantNames: z.boolean(),
  autoPublishResults: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

const CreateSessionForm: React.FC = () => {
  const { createSession } = useAppContext();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      pollFrequency: 5,
      saveTranscript: true,
      participantNames: true,
      autoPublishResults: false,
    },
  });

  const onSubmit = (data: FormValues) => {
    createSession(data.title, {
      pollFrequency: data.pollFrequency,
      saveTranscript: data.saveTranscript,
      participantNames: data.participantNames,
      autoPublishResults: data.autoPublishResults,
    });
  };

  return (
    <div className="max-w-lg mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Session Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter a title for your session"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="pollFrequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Poll Generation Frequency</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Every 1 minute</SelectItem>
                    <SelectItem value="2">Every 2 minutes</SelectItem>
                    <SelectItem value="3">Every 3 minutes</SelectItem>
                    <SelectItem value="5">Every 5 minutes</SelectItem>
                    <SelectItem value="10">Every 10 minutes</SelectItem>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  New polls will be automatically generated from the transcript at this interval
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="saveTranscript"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Save Transcript
                    </FormLabel>
                    <FormDescription>
                      Record and save the transcript of the session
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="participantNames"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Require Participant Names
                    </FormLabel>
                    <FormDescription>
                      Participants must enter their name to join
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="autoPublishResults"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Auto-Publish Results
                    </FormLabel>
                    <FormDescription>
                      Automatically show results to all participants
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <Button type="submit" className="w-full">
            Create Session
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default CreateSessionForm;
