#!/usr/bin/perl
use strict;
use warnings;
use CGI;
use JSON;
use LWP::UserAgent;
use CGI::Carp qw(fatalsToBrowser);
use File::Temp qw(tempfile);

my $cgi = CGI->new;
print $cgi->header('application/json');

my $input = $cgi->param('POSTDATA');
my $data = eval { decode_json($input) } || {};

# Simple coach storage (replace with DB in production)
my $coaches_file = './coaches.json';

sub load_coaches {
    open my $fh, '<', $coaches_file or return [];
    local $/;
    my $json = <$fh>;
    close $fh;
    return decode_json($json);
}

sub save_coaches {
    my ($coaches) = @_;
    open my $fh, '>', $coaches_file or die "Can't write coaches: $!";
    print $fh encode_json($coaches);
    close $fh;
}

# Support GET method for listing coaches
if ($cgi->request_method eq 'GET' && ($cgi->param('action') // '') eq 'list_coaches') {
    my $coaches = load_coaches();
    print encode_json($coaches);
    exit;
}

if ($data->{action} eq 'list_coaches') {
    my $coaches = load_coaches();
    print encode_json($coaches);
    exit;
}

if ($data->{action} eq 'save_coach') {
    my $coaches = load_coaches();
    my $coach = $data->{coach};
    # Update or add coach
    my $found = 0;
    for (@$coaches) {
        if ($_->{id} eq $coach->{id}) {
            %$_ = %$coach;
            $found = 1;
            last;
        }
    }
    push @$coaches, $coach unless $found;
    save_coaches($coaches);
    print '{"status":"ok"}';
    exit;
}

if ($data->{action} eq 'save_coaches') {
    my $coaches = $data->{coaches};
    save_coaches($coaches);
    print '{"status":"ok"}';
    exit;
}

if ($data->{action} eq 'delete_coach') {
    my $coaches = load_coaches();
    my $id = $data->{id};
    @$coaches = grep { $_->{id} ne $id } @$coaches;
    save_coaches($coaches);
    print '{"status":"ok"}';
    exit;
}

if ($data->{action} eq 'chat') {
    my $coach_id = $data->{coach_id};
    my $message = $data->{message};
    my $coaches = load_coaches();
    my ($coach) = grep { $_->{id} eq $coach_id } @$coaches;
    my $persona = $coach ? $coach->{persona} : '';
    my $greeting = $coach ? $coach->{greeting} : '';

    # Compose prompt
    my $prompt = $persona ? "$persona\n" : '';
    $prompt .= $greeting ? "$greeting\n" : '';
    $prompt .= "User: $message\nAI:";

    # Call OpenAI API
    my $api_key = $ENV{OPENAI_API_KEY} || 'sk-...'; # Set your key in env
    my $ua = LWP::UserAgent->new;
    my $res = $ua->post(
        'https://api.openai.com/v1/chat/completions',
        'Content-Type' => 'application/json',
        'Authorization' => "Bearer $api_key",
        Content => encode_json({
            model => 'gpt-3.5-turbo',
            messages => [
                { role => 'system', content => $persona },
                { role => 'user', content => $message }
            ],
            max_tokens => 512,
        })
    );

    if ($res->is_success) {
        my $resp = decode_json($res->decoded_content);
        my $reply = $resp->{choices}[0]{message}{content} || '';
        print encode_json({ reply => $reply });
    } else {
        print encode_json({ error => "OpenAI API error" });
    }
    exit;
}

if ($data->{action} eq 'login') {
    my $email = $data->{email};
    my $password = $data->{password};
    # TODO: Implement actual login logic
    print encode_json({ status => 'ok' });
    exit;
}

if ($data->{action} eq 'signup') {
    my $username = $data->{username};
    my $email = $data->{email};
    my $password = $data->{password};
    # TODO: Implement actual signup logic
    print encode_json({ status => 'ok' });
    exit;
}

if ($data->{action} eq 'forgot_password') {
    my $email = $data->{email};
    # TODO: Implement actual password reset logic
    print encode_json({ status => 'ok' });
    exit;
}

if ($cgi->request_method eq 'POST' && $cgi->param('action') && $cgi->param('action') eq 'vision') {
    my $upload = $cgi->upload('image');
    if ($upload) {
        # Save uploaded image to temp file
        my ($fh, $filename) = tempfile(SUFFIX => '.png');
        binmode $fh;
        while (my $bytesread = read($upload, my $buffer, 1024)) {
            print $fh $buffer;
        }
        close $fh;

        # Read image as base64
        open my $img_fh, '<', $filename or die "Can't open image: $!";
        binmode $img_fh;
        my $img_data;
        { local $/; $img_data = <$img_fh>; }
        close $img_fh;
        unlink $filename;
        require MIME::Base64;
        my $base64 = MIME::Base64::encode_base64($img_data, '');

        # Call OpenAI Vision API (GPT-4-vision-preview)
        my $api_key = $ENV{OPENAI_API_KEY} || 'sk-...';
        my $ua = LWP::UserAgent->new;
        my $res = $ua->post(
            'https://api.openai.com/v1/chat/completions',
            'Content-Type' => 'application/json',
            'Authorization' => "Bearer $api_key",
            Content => encode_json({
                model => 'gpt-4-vision-preview',
                messages => [
                    {
                        role => 'user',
                        content => [
                            { type => 'text', content => 'Analyze this screenshot and describe what you see. If it is a game, provide tips or insights.' },
                            { type => 'image_url', image_url => "data:image/png;base64,$base64" }
                        ]
                    }
                ],
                max_tokens => 512,
            })
        );

        if ($res->is_success) {
            my $resp = decode_json($res->decoded_content);
            my $reply = $resp->{choices}[0]{message}{content} || '';
            print encode_json({ reply => $reply });
        } else {
            print encode_json({ error => "OpenAI Vision API error" });
        }
        exit;
    } else {
        print encode_json({ error => "No image uploaded" });
        exit;
    }
}

if ($cgi->param('action') && $cgi->param('action') eq 'transcribe_audio') {
    my $upload = $cgi->upload('audio');
    if ($upload) {
        # Save uploaded audio to temp file
        my ($fh, $filename) = tempfile(SUFFIX => '.webm');
        binmode $fh;
        while (my $bytesread = read($upload, my $buffer, 1024)) {
            print $fh $buffer;
        }
        close $fh;

        # Call OpenAI Whisper API
        my $ua = LWP::UserAgent->new;
        my $res = $ua->post(
            'https://api.openai.com/v1/audio/transcriptions',
            'Authorization' => "Bearer $api_key",
            'Content-Type' => 'multipart/form-data',
            'Content' => [
                file => [$filename],
                model => 'whisper-1',
            ]
        );

        unlink $filename; # Clean up temp file

        if ($res->is_success) {
            my $resp = decode_json($res->decoded_content);
            print encode_json({ 
                text => $resp->{text},
                reply => "Response to transcribed audio..." # Add AI response logic here
            });
        } else {
            print encode_json({ error => "Failed to transcribe audio" });
        }
    } else {
        print encode_json({ error => "No audio uploaded" });
    }
    exit;
}

if ($data->{action} eq 'contactus') {
    my $contact_data = $data->{data};
    
    # TODO: Add your contact form processing logic here
    # For example, sending email, saving to database, etc.
    
    print encode_json({ status => 'ok' });
    exit;
}

print encode_json({ error => "Unknown action" });
