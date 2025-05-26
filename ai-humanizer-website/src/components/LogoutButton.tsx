import React from 'react';
import supabase from '../utils/supabaseClient';

const LogoutButton: React.FC = () => {
    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <button onClick={handleLogout}>
            Logout
        </button>
    );
};

export default LogoutButton;