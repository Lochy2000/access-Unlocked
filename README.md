# Access-Unlocked

A travel companion application for people with mobility issues. Access-Unlocked helps users locate the nearest accessible amenities including lifts, accessible toilets, ramps, parking spaces, and other critical facilities.

## 🎯 Mission

Making the world more accessible by providing real-time information about accessible facilities to those who need them most.

## ✨ Features

### Core Functionality
- **Location-Based Search**: Request user location and find nearby accessible facilities
- **Multi-Amenity Support**: Search for lifts, accessible toilets, ramps, parking, and more
- **Real-Time Data**: Integration with multiple open-source APIs for up-to-date information
- **Route Planning**: Navigate to accessible facilities with mobility-friendly routes
- **User Contributions**: Community-driven data to enhance accessibility information
- **Offline Mode**: Cache critical data for use without internet connection

### Accessibility Features
- **Screen Reader Compatible**: Full support for screen readers
- **High Contrast Mode**: Enhanced visibility options
- **Voice Commands**: Hands-free operation support
- **Customizable Text Size**: Adjustable for visual impairments
- **Simple Interface**: Easy-to-use design with large touch targets

## 🏗️ Architecture

Access-Unlocked uses a modern, scalable architecture designed to aggregate data from multiple sources and deliver it efficiently to users.

```
User Device (Mobile/Web)
    ↓
API Gateway / Load Balancer
    ↓
Application Server
    ├── Location Service
    ├── Search Engine
    ├── Route Planning Service
    └── Cache Layer
         ↓
Data Aggregation Layer
    ├── OpenStreetMap API
    ├── Wheelmap API
    ├── Google Places API
    ├── Local Government APIs
    └── User Contributions DB
         ↓
Data Storage
    ├── PostgreSQL (Primary)
    ├── Redis (Cache)
    └── Elasticsearch (Search)
```

For detailed architecture documentation, see [ARCHITECTURE.md](ARCHITECTURE.md)

## 📚 Documentation

- [Architecture Overview](ARCHITECTURE.md) - High-level system design and components
- [API Integration Guide](API_INTEGRATION.md) - Details on integrated APIs and data sources
- [Contributing Guidelines](CONTRIBUTING.md) - How to contribute to the project
- [API Documentation](docs/API.md) - Internal API endpoints and usage
- [Database Schema](docs/DATABASE_SCHEMA.md) - Data models and relationships
- [Deployment Guide](docs/DEPLOYMENT.md) - Deployment instructions

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Python 3.9+
- PostgreSQL 14+
- Redis 6+
- API keys for external services (see API_INTEGRATION.md)

### Installation

```bash
# Clone the repository
git clone https://github.com/Lochy2000/access-Unlocked.git
cd access-Unlocked

# Install dependencies
npm install
# or
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys and configuration

# Initialize database
npm run db:migrate
# or
python manage.py migrate

# Start the development server
npm run dev
# or
python manage.py runserver
```

### Configuration

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/access_unlocked

# Redis Cache
REDIS_URL=redis://localhost:6379

# API Keys
OPENSTREETMAP_API_KEY=your_key_here
GOOGLE_PLACES_API_KEY=your_key_here
WHEELMAP_API_KEY=your_key_here

# Application
NODE_ENV=development
PORT=3000
```

## 🔑 API Keys Required

This application requires API keys from several services:

1. **OpenStreetMap** (Free) - Base mapping and location data
2. **Wheelmap** (Free) - Wheelchair accessibility information
3. **Google Places API** (Paid/Free tier) - Additional place details
4. **Mapbox** (Optional) - Enhanced mapping and routing

See [API_INTEGRATION.md](API_INTEGRATION.md) for detailed setup instructions.

## 🧪 Testing

```bash
# Run all tests
npm test
# or
pytest

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Key Areas for Contribution
- Adding new API integrations
- Improving accessibility features
- Expanding facility database
- Translation and localization
- Bug fixes and performance improvements

## 📱 Supported Platforms

- **Web**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **iOS**: iOS 13+
- **Android**: Android 8.0+
- **Progressive Web App** (PWA): Installable on supported devices

## 🔒 Privacy & Security

- User location data is processed locally when possible
- No location tracking or history storage without explicit consent
- All API communications use HTTPS
- Regular security audits and updates

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenStreetMap contributors
- Wheelmap community
- All open-source API providers
- Accessibility advocates and testers

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Lochy2000/access-Unlocked/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Lochy2000/access-Unlocked/discussions)
- **Email**: support@access-unlocked.org

## 🗺️ Roadmap

### Phase 1 (Current)
- [x] Project documentation
- [ ] Core API integrations
- [ ] Basic location search
- [ ] Web application MVP

### Phase 2
- [ ] Mobile applications (iOS/Android)
- [ ] User contribution system
- [ ] Route planning
- [ ] Offline mode

### Phase 3
- [ ] AI-powered recommendations
- [ ] Community features
- [ ] Advanced filtering
- [ ] Multi-language support

---

**Built with ❤️ for accessibility**
