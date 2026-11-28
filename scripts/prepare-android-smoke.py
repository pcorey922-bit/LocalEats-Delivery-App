"""Read-only selection/verification for the existing signed APK emulator job."""
import json
import os
import sys
from pathlib import Path
from staging_apk_policy import verify_smoke_source, verify_smoke_input

if sys.argv[1] == 'source':
    app = verify_smoke_source(json.loads(Path(sys.argv[3]).read_text()),
                              json.loads(Path(sys.argv[4]).read_text()),
                              sys.argv[2], os.environ['GITHUB_REPOSITORY'])
    with open(os.environ['GITHUB_ENV'], 'a') as env:
        for key in ('audience', 'package', 'activity', 'scheme', 'artifact', 'apk', 'source'):
            env.write('ROCOEATS_SMOKE_' + key.upper() + '=' + str(app[key]) + '\n')
elif sys.argv[1] == 'input':
    app = verify_smoke_input(sys.argv[3], sys.argv[2], os.environ['ROCOEATS_SMOKE_SOURCE'])
    print(json.dumps({'source': app['source'], 'package': app['package'], 'audience': app['audience']}))
else:
    raise ValueError('Use source or input')
