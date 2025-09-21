/**
 * Handlebars Helpers
 * Custom helpers for Handlebars templating
 */

module.exports = {
  // Helper to repeat something n times
  times: function(n, block) {
    let result = '';
    for (let i = 0; i < n; i++) {
      result += block.fn(i);
    }
    return result;
  },

  // Helper to format dates
  formatDate: function(date, format) {
    if (!date) return '';
    
    const d = new Date(date);
    
    switch (format) {
      case 'short':
        return d.toLocaleDateString();
      case 'long':
        return d.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'relative':
        return this.timeAgo(date);
      default:
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
    }
  },

  // Helper to show time ago
  timeAgo: function(date) {
    if (!date) return '';
    
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return past.toLocaleDateString();
  },

  // Helper for conditional equality
  ifEquals: function(a, b, options) {
    if (a === b) {
      return options.fn(this);
    }
    return options.inverse(this);
  },

  // Helper for conditional greater than
  ifGreater: function(a, b, options) {
    if (a > b) {
      return options.fn(this);
    }
    return options.inverse(this);
  },

  // Helper to format numbers
  formatNumber: function(num) {
    if (!num) return '0';
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  },

  // Helper to format percentage
  formatPercent: function(num, decimals = 1) {
    if (!num) return '0%';
    return `${parseFloat(num).toFixed(decimals)}%`;
  },

  // Helper to truncate text
  truncate: function(str, length, options) {
    if (!str) return '';
    
    const suffix = options.hash.suffix || '...';
    
    if (str.length <= length) {
      return str;
    }
    
    return str.substring(0, length) + suffix;
  },

  // Helper to capitalize first letter
  capitalize: function(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  // Helper to convert to uppercase
  uppercase: function(str) {
    if (!str) return '';
    return str.toUpperCase();
  },

  // Helper to convert to lowercase
  lowercase: function(str) {
    if (!str) return '';
    return str.toLowerCase();
  },

  // Helper for JSON stringify
  json: function(context) {
    return JSON.stringify(context);
  },

  // Helper to get current year
  currentYear: function() {
    return new Date().getFullYear();
  },

  // Helper to check if array has items
  hasItems: function(array, options) {
    if (array && array.length > 0) {
      return options.fn(this);
    }
    return options.inverse(this);
  },

  // Helper to get array length
  length: function(array) {
    if (!array) return 0;
    return array.length;
  },

  // Helper for math operations
  math: function(a, operator, b) {
    a = parseFloat(a);
    b = parseFloat(b);
    
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b !== 0 ? a / b : 0;
      case '%': return b !== 0 ? a % b : 0;
      default: return 0;
    }
  },

  // Helper to format file size
  formatFileSize: function(bytes) {
    if (!bytes) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  },

  // Helper to generate random ID
  randomId: function() {
    return Math.random().toString(36).substr(2, 9);
  },

  // Helper for URL encoding
  urlEncode: function(str) {
    if (!str) return '';
    return encodeURIComponent(str);
  },

  // Helper to check if development environment
  isDev: function(options) {
    if (process.env.NODE_ENV === 'development') {
      return options.fn(this);
    }
    return options.inverse(this);
  },

  // Helper to check if production environment
  isProd: function(options) {
    if (process.env.NODE_ENV === 'production') {
      return options.fn(this);
    }
    return options.inverse(this);
  }
};