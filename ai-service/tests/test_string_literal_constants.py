"""
Test to verify string literal constants are correctly defined and preserve original values.
This test validates PR-2: String Value Preservation requirement.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from chatbot.advanced_query_processor import (
    CUSTOMER_SEGMENT_ES, CUSTOMER_SEGMENT_EN,
    COUNTRY_SEGMENT_ES, COUNTRY_SEGMENT_EN,
    COUNTRY_OR_SEGMENT_EN, COUNTRY_OR_SEGMENT_ES,
    COUNTRY_SEGMENT_BUYS_ES, COUNTRY_SEGMENT_BUYS_EN,
    CUSTOMER_SEGMENT_SEEMS_EN, SEGMENT_SEEMS_ES,
    WHICH_SEGMENT_SEEMS_EN, WHICH_SEGMENT_SEEMS_ES,
    SEEMS_MOST_VALUABLE_EN, SEEMS_MOST_VALUABLE_ES,
    BUYS_MOST_OFTEN_EN, BUYS_MOST_OFTEN_ES,
    BUYS_FREQUENTLY_EN, BUYS_FREQUENTLY_ES
)


def test_customer_segment_constants():
    """Verify customer segment constants have correct values."""
    assert CUSTOMER_SEGMENT_ES == 'qué cliente o segmento'
    assert CUSTOMER_SEGMENT_EN == 'which customer segment'


def test_country_segment_constants():
    """Verify country segment constants have correct values."""
    assert COUNTRY_SEGMENT_ES == 'qué país o segmento'
    assert COUNTRY_SEGMENT_EN == 'which country or segment'
    assert COUNTRY_OR_SEGMENT_EN == 'country or segment'
    assert COUNTRY_OR_SEGMENT_ES == 'país o segmento'


def test_country_segment_buys_constants():
    """Verify country segment buys constants have correct values."""
    assert COUNTRY_SEGMENT_BUYS_ES == 'país o segmento compra'
    assert COUNTRY_SEGMENT_BUYS_EN == 'country or segment buys'


def test_segment_seems_constants():
    """Verify segment seems constants have correct values."""
    assert CUSTOMER_SEGMENT_SEEMS_EN == 'customer segment seems'
    assert SEGMENT_SEEMS_ES == 'segmento parece'
    assert WHICH_SEGMENT_SEEMS_EN == 'which segment seems'
    assert WHICH_SEGMENT_SEEMS_ES == 'qué segmento parece'


def test_valuable_constants():
    """Verify valuable constants have correct values."""
    assert SEEMS_MOST_VALUABLE_EN == 'seems most valuable'
    assert SEEMS_MOST_VALUABLE_ES == 'parece más valioso'


def test_buys_often_constants():
    """Verify buys often constants have correct values."""
    assert BUYS_MOST_OFTEN_EN == 'buys most often'
    assert BUYS_MOST_OFTEN_ES == 'compra más seguido'


def test_buys_frequently_constants():
    """Verify buys frequently constants have correct values."""
    assert BUYS_FREQUENTLY_EN == 'buys frequently'
    assert BUYS_FREQUENTLY_ES == 'compra frecuentemente'


def test_string_matching_behavior():
    """Verify that string matching behavior is preserved."""
    # Test that the constants can be used in string matching
    test_query_es = "qué cliente o segmento compra más seguido"
    test_query_en = "which customer segment buys most often"
    
    # Verify Spanish query contains the constants
    assert CUSTOMER_SEGMENT_ES in test_query_es
    assert BUYS_MOST_OFTEN_ES in test_query_es
    
    # Verify English query contains the constants
    assert CUSTOMER_SEGMENT_EN in test_query_en
    assert BUYS_MOST_OFTEN_EN in test_query_en


if __name__ == '__main__':
    test_customer_segment_constants()
    test_country_segment_constants()
    test_country_segment_buys_constants()
    test_segment_seems_constants()
    test_valuable_constants()
    test_buys_often_constants()
    test_buys_frequently_constants()
    test_string_matching_behavior()
    print("✅ All string literal constant tests passed!")
