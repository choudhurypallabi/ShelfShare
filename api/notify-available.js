import { createClient } from '@supabase/supabase-js';

// Emails everyone on a book's waitlist that it's available again, then
// clears the waitlist. Runs server-side with the service-role key because
// RLS (correctly) prevents one user from reading others' emails or
// deleting their waitlist rows.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return res.status(500).json({ error: 'Notification service is not configured' });
  }

  const { bookId } = req.body ?? {};
  if (!bookId) {
    return res.status(400).json({ error: 'bookId is required' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: book } = await supabase
    .from('books')
    .select('id, title, author, status')
    .eq('id', bookId)
    .single();
  if (!book || book.status !== 'Available') {
    return res.status(400).json({ error: 'Book is not available' });
  }

  const { data: waitlist } = await supabase
    .from('waitlist')
    .select('user_id, profiles(email, name)')
    .eq('book_id', bookId);
  const recipients = (waitlist ?? [])
    .map((w) => w.profiles)
    .filter((p) => p?.email);

  const appUrl = process.env.APP_URL || 'https://shelf-share-ruby.vercel.app';
  let sent = 0;
  for (const person of recipients) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ShelfShare <onboarding@resend.dev>',
        to: person.email,
        subject: `"${book.title}" is available again on ShelfShare`,
        html: `
          <p>Hi ${person.name || 'there'},</p>
          <p>Good news — <strong>${book.title}</strong> by ${book.author} has just been
          returned and is available to borrow again.</p>
          <p><a href="${appUrl}/book/${book.id}">Borrow it now on ShelfShare</a>
          (first come, first served).</p>
          <p>— ShelfShare</p>
        `,
      }),
    });
    if (response.ok) sent += 1;
  }

  await supabase.from('waitlist').delete().eq('book_id', bookId);

  return res.status(200).json({ notified: sent, waitlisted: recipients.length });
}
