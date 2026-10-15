-- 0005_storage_policies.sql
-- Storage bucket configuration and policies for NexusFlow AI

-- Create the private bucket for enterprise documents if storage schema exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'enterprise-documents', 
    'enterprise-documents', 
    false, 
    10485760, -- 10MB limit
    ARRAY[
        'application/pdf', 
        'text/plain', 
        'text/markdown', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
)
ON CONFLICT (id) DO UPDATE SET 
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
        'application/pdf', 
        'text/plain', 
        'text/markdown', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

-- Storage Policies for 'enterprise-documents' bucket
-- Storage objects path convention: <organization_id>/<filename>

CREATE POLICY "Enterprise Document Storage: Upload by Org Members"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'enterprise-documents' AND
        auth.uid() IS NOT NULL AND
        public.check_is_org_member(
            (regexp_match(name, '^([0-9a-fA-F-]+)/'))[1]::uuid
        )
    );

CREATE POLICY "Enterprise Document Storage: Read by Org Members"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'enterprise-documents' AND
        auth.uid() IS NOT NULL AND
        public.check_is_org_member(
            (regexp_match(name, '^([0-9a-fA-F-]+)/'))[1]::uuid
        )
    );

CREATE POLICY "Enterprise Document Storage: Delete by Org Admin or Owner"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'enterprise-documents' AND
        auth.uid() IS NOT NULL AND (
            public.check_is_org_admin(
                (regexp_match(name, '^([0-9a-fA-F-]+)/'))[1]::uuid
            ) OR
            owner = auth.uid()
        )
    );
