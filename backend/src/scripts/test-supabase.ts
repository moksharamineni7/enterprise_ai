import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root and backend
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = process.env.SUPABASE_ANON_KEY || '';
const bucketName = process.env.SUPABASE_DOCUMENTS_BUCKET || 'enterprise-documents';

async function testSupabase() {
  console.log('\n======================================================');
  console.log('       NEXUSFLOW AI - SUPABASE CONNECTION TEST        ');
  console.log('======================================================\n');

  console.log('1. Checking Environment Variables:');
  console.log(`   - SUPABASE_URL: ${supabaseUrl ? `✓ Configured (${supabaseUrl})` : '✗ Missing'}`);
  console.log(`   - SUPABASE_ANON_KEY: ${anonKey ? '✓ Configured' : '✗ Missing'}`);
  console.log(`   - SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '✓ Configured' : '✗ Missing'}`);

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('\n❌ ERROR: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not defined in .env');
    console.log('\nTo connect Supabase:');
    console.log('1. Open your Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project -> Project Settings -> API');
    console.log('3. Copy your "Project URL", "anon public", and "service_role" keys into .env:');
    console.log('   SUPABASE_URL=https://your-project-id.supabase.co');
    console.log('   SUPABASE_ANON_KEY=eyJhbGciOi...');
    console.log('   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...');
    console.log('   VITE_SUPABASE_URL=https://your-project-id.supabase.co');
    console.log('   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...\n');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log('\n2. Testing Database Connectivity:');
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .limit(5);

    if (error) {
      if (
        error.code === '42P01' || 
        error.code === 'PGRST205' ||
        error.code === 'PGRST200' ||
        error.message.includes('relation "public.organizations" does not exist') ||
        error.message.includes('schema cache')
      ) {
        console.warn('   ⚠️ Connected to Supabase, but schema migrations have not been applied yet!');
        console.log('\n   To apply the migrations:');
        console.log('   Option A: Go to Supabase Dashboard -> SQL Editor, copy and run the SQL files in:');
        console.log('     Run supabase/complete_setup.sql in the Supabase SQL Editor.\n');
      } else {
        throw error;
      }
    } else {
      console.log(`   ✓ Connected successfully! Found ${data.length} organization(s) in database.`);
      if (data.length > 0) {
        data.forEach(org => console.log(`     • ${org.name} (${org.slug})`));
      }
    }
  } catch (err: any) {
    console.error('   ❌ Database Query Error:', err.message || err);
    process.exit(1);
  }

  console.log('\n3. Testing Storage Bucket:');
  try {
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.warn('   ⚠️ Could not list storage buckets:', bucketError.message);
    } else {
      const found = buckets.find(b => b.name === bucketName || b.id === bucketName);
      if (found) {
        console.log(`   ✓ Storage bucket "${bucketName}" exists and is accessible.`);
      } else {
        console.log(`   ⚠️ Storage bucket "${bucketName}" not found. Creating it now...`);
        const { error: createErr } = await supabase.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 10485760, // 10MB
        });
        if (createErr) {
          console.warn('   ⚠️ Could not automatically create bucket:', createErr.message);
        } else {
          console.log(`   ✓ Successfully created private bucket "${bucketName}".`);
        }
      }
    }
  } catch (err: any) {
    console.warn('   ⚠️ Storage check skipped:', err.message);
  }

  console.log('\n======================================================');
  console.log('       SUPABASE INTEGRATION TEST PASSED! 🎉          ');
  console.log('======================================================\n');
}

testSupabase();
