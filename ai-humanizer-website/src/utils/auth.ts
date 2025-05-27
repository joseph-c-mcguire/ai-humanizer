import supabase from './supabaseClient';

export const signUpUser = async ({ email, password, firstName, lastName }) => {
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

export const signInUser = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data?.user, error };
};

export const signOutUser = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
};
