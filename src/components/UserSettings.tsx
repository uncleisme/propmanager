import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { User } from '../types';

interface UserSettingsProps {
  user: any;
}

const UserSettings: React.FC<UserSettingsProps> = ({ user: currentUser }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      if (currentUser) {
        // Try to get profile from database
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (data) {
          setUser(data);
          setFullName(data.full_name || '');
          setAvatarUrl(data.avatar_url || '');
        } else {
          // If no profile exists, create one with user metadata
          const newProfile = {
            id: currentUser.id,
            full_name: currentUser.user_metadata?.full_name || '',
            avatar_url: '',
            email: currentUser.email || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile]);
            
          if (!insertError) {
            setUser(newProfile as any);
            setFullName(newProfile.full_name);
            setAvatarUrl(newProfile.avatar_url);
          } else {
            console.error('Error creating profile:', insertError);
          }
        }
        
        setEmail(currentUser.email || '');
      }
      setLoading(false);
    };
    fetchUser();
  }, [currentUser]);


  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updates = {
      id: user.id,
      full_name: fullName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('profiles').upsert(updates);
    if (error) {
      alert(error.message);
    } else {
      alert('Profile updated successfully!');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      alert('Please enter a new password.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      alert(error.message);
    } else {
      setPassword('');
      alert('Password updated successfully!');
    }
  };

const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
  try {
    setUploading(true);

    if (!e.target.files || e.target.files.length === 0) {
      alert('Please select an image to upload.');
      return;
    }

    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Max size is 5MB.');
      return;
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    // 1. First upload to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) throw uploadError;

    // 2. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // 3. Update profile with new URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUser.id);

    if (updateError) throw updateError;

    setAvatarUrl(publicUrl);
    alert('Profile photo updated successfully!');
  } catch (error) {
    console.error('Avatar upload error:', error);
    alert(`Error uploading avatar: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    setUploading(false);
  }
};


  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8">
        <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">User Profile</h1>
      <p className="text-gray-600">Manage your profile information</p>
    </div>
  </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Avatar */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Profile Photo</h2>
          <div className="flex flex-col items-center space-y-4">
            <img
              src={avatarUrl || `https://via.placeholder.com/300?text=No+Photo`}
              alt="Avatar"
              className="w-48 h-48 rounded-full object-cover border-4 border-gray-200 shadow-lg"
            />
            <div className="text-center">
              <label htmlFor="avatar" className="cursor-pointer inline-block bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                {uploading ? 'Uploading...' : 'Change Photo'}
              </label>
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={handleUploadAvatar}
                disabled={uploading}
                className="hidden"
              />
              <p className="text-xs text-gray-500 mt-2">
                JPG, PNG or GIF (max 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - User Info */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
    Full Name
  </label>
  <input
    type="text"
    id="fullName"
    value={fullName}
    onChange={(e) => setFullName(e.target.value)}
    className="max-w-xs w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
    placeholder="Enter your full name"
  />
</div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
    className="max-w-xs w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>
            
            <button
  type="submit"
  className="max-w-xs w-full px-3 py-2 bg-indigo-600 text-white rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200 sm:text-sm"
>
  Update Profile
</button>
          </form>

          {/* Password Change Section */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-medium mb-4">Change Password</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
    className="max-w-xs w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Enter new password (min 6 characters)"
                  minLength={6}
                />
              </div>
              <button
  type="submit"
  className="max-w-xs w-full px-3 py-2 bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 sm:text-sm"
>
  Update Password
</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;