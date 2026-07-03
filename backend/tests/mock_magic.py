import sys
from unittest.mock import MagicMock

mock_magic = MagicMock()
mock_magic.from_buffer = MagicMock(return_value="application/pdf")
sys.modules['magic'] = mock_magic
