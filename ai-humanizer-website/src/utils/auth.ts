import supabase from './supabaseClient';

export const signUpUser = async ({
  email,
  password,
  firstName,
  lastName,
}: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) {
    return { error };
  }

  // Log sign-up event
  if (data?.user?.id) {
    await supabase.from('auth_logs').insert([{ event_type: 'sign_up', user_id: data.user.id }]);
  }

  return { user: data.user };
};

export const signInUser = async ({ email, password }: { email: string; password: string }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user, error };
};

export const signOutUser = async () => {
  return supabase.auth.signOut();
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};
