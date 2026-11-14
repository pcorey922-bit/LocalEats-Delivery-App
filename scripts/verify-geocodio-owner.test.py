import importlib.util
from pathlib import Path
import os
import sys
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True

spec = importlib.util.spec_from_file_location("owner", Path(__file__).with_name("verify-geocodio-owner.py"))
owner = importlib.util.module_from_spec(spec)
spec.loader.exec_module(owner)


class OwnerRunnerTests(unittest.TestCase):
    def test_noninteractive_never_prompts_or_calls_provider(self):
        with patch.object(owner.sys, "argv", ["runner"]), patch.object(owner.sys.stdin, "isatty", return_value=False), patch.object(owner.getpass, "getpass") as prompt, patch.object(owner.subprocess, "run") as run:
            self.assertEqual(owner.main(), 1)
            prompt.assert_not_called()
            run.assert_not_called()

    def test_masked_key_only_in_child_environment_and_cleared(self):
        secret = "local_fixture_only_never_real_key"
        before = dict(os.environ)
        def child(args, **kwargs):
            self.assertNotIn(secret, " ".join(args))
            self.assertEqual(kwargs["env"]["GEOCODIO_API_KEY"], secret)
            self.assertEqual(args[-2:], ["--live", "--confirm-free-tier"])
            return type("Result", (), {"returncode": 2})()
        with patch.object(owner.sys, "argv", ["runner"]), patch.object(owner.sys.stdin, "isatty", return_value=True), patch.object(owner.sys.stderr, "isatty", return_value=True), patch("builtins.input", return_value="YES"), patch.object(owner.getpass, "getpass", return_value=secret), patch.object(owner.subprocess, "run", side_effect=child) as run:
            self.assertEqual(owner.main(), 2)
            self.assertNotIn("GEOCODIO_API_KEY", run.call_args.kwargs["env"])
        self.assertEqual(dict(os.environ), before)

    def test_no_free_tier_confirmation_never_requests_key(self):
        with patch.object(owner.sys, "argv", ["runner"]), patch.object(owner.sys.stdin, "isatty", return_value=True), patch.object(owner.sys.stderr, "isatty", return_value=True), patch("builtins.input", return_value="NO"), patch.object(owner.getpass, "getpass") as prompt:
            self.assertEqual(owner.main(), 1)
            prompt.assert_not_called()

    def test_unmasked_fallback_and_invalid_keys_fail_closed(self):
        for failure in [owner.getpass.GetPassWarning(), ValueError()]:
            with patch.object(owner.sys, "argv", ["runner"]), patch.object(owner.sys.stdin, "isatty", return_value=True), patch.object(owner.sys.stderr, "isatty", return_value=True), patch("builtins.input", return_value="YES"), patch.object(owner.getpass, "getpass", side_effect=failure), patch.object(owner.subprocess, "run") as run:
                self.assertEqual(owner.main(), 1)
                run.assert_not_called()


if __name__ == "__main__":
    unittest.main()
