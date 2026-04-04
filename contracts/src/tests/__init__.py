# Make tests work without GenLayer dependencies
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# Mock GenLayer imports for testing
class MockContract:
    pass

class MockGl:
    class Contract:
        pass
    
    class public:
        @staticmethod
        def view(func):
            return func
        
        @staticmethod
        def write(func):
            return func

# Mock genlayer module
import types
genlayer_module = types.ModuleType('genlayer')
genlayer_module.gl = MockGl()
genlayer_module.DynArray = list
genlayer_module.TreeMap = dict
sys.modules['genlayer'] = genlayer_module

# Mock allow_storage decorator
def allow_storage(cls):
    return cls

# Add to sys.modules
sys.modules['allow_storage'] = types.ModuleType('allow_storage')
sys.modules['allow_storage'].allow_storage = allow_storage

# Now import our modules
from content_registry import ContentRegistry, Article, User
