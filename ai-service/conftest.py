"""Pytest configuration for AI Service tests"""

import sys
import os

# Add the ai-service directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Fix for scipy/array_api_compat incompatibility with Python 3.14
# When torch is installed, scipy's _issubclass_fast uses issubclass() with a string
# argument which Python 3.14 no longer allows. We patch it before any imports.
def _patch_scipy_array_api_compat():
    """Patch scipy's array_api_compat to fix Python 3.14 compatibility."""
    try:
        # Try to patch the problematic function if it exists
        from scipy._lib.array_api_compat.common import _helpers
        from functools import lru_cache
        
        @lru_cache(100)
        def _issubclass_fast_patched(cls, modname, clsname):
            try:
                mod = sys.modules[modname]
            except KeyError:
                return False
            parent_cls = getattr(mod, clsname, None)
            if parent_cls is None:
                return False
            try:
                return issubclass(cls, parent_cls)
            except TypeError:
                return False
        
        _helpers._issubclass_fast = _issubclass_fast_patched
    except (ImportError, AttributeError):
        pass


_patch_scipy_array_api_compat()
