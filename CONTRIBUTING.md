# Contributing to Access-Unlocked

Thank you for your interest in contributing to Access-Unlocked! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

### Our Pledge

We are committed to making participation in this project a harassment-free experience for everyone, regardless of:
- Age, body size, disability, ethnicity, gender identity and expression
- Level of experience, nationality, personal appearance, race, religion
- Sexual identity and orientation

### Our Standards

**Positive behaviors include:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors include:**
- Harassment, trolling, or derogatory comments
- Publishing others' private information without permission
- Any conduct which could reasonably be considered inappropriate

### Enforcement

Instances of unacceptable behavior can be reported to the project team at conduct@access-unlocked.org. All complaints will be reviewed and investigated promptly and fairly.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

**When creating a bug report, include:**
- **Title**: Clear and descriptive title
- **Description**: Detailed description of the issue
- **Steps to Reproduce**: Step-by-step instructions
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Screenshots**: If applicable
- **Environment**: 
  - OS (Windows, macOS, Linux, iOS, Android)
  - Browser/App version
  - Device type (if mobile)

**Example:**
```markdown
**Bug**: Search fails when location services are disabled

**Steps to Reproduce:**
1. Disable location services on device
2. Open Access-Unlocked
3. Attempt to search for accessible toilets

**Expected**: App should prompt to enable location or allow manual location entry

**Actual**: App crashes with error "Cannot read property 'lat' of undefined"

**Environment**: iOS 16.0, Safari, iPhone 12
```

### Suggesting Features

Feature suggestions are welcome! Before suggesting:
- Check if the feature already exists
- Search existing feature requests
- Consider if it aligns with project goals

**Feature request template:**
```markdown
**Feature**: [Brief title]

**Problem**: What problem does this solve?

**Proposed Solution**: How should it work?

**Alternatives**: What alternatives have you considered?

**Benefits**: Who would benefit and how?

**Implementation Notes**: Any technical considerations?
```

### Contributing Code

#### First Time Contributors

Look for issues labeled:
- `good first issue` - Good for newcomers
- `help wanted` - Need community help
- `documentation` - Documentation improvements

#### Types of Contributions

1. **Bug Fixes**: Fix reported bugs
2. **Features**: Implement new features
3. **Performance**: Optimize existing code
4. **Documentation**: Improve docs
5. **Tests**: Add or improve tests
6. **Accessibility**: Enhance accessibility features
7. **API Integrations**: Add new data sources

### Contributing Data

Help improve our accessibility database:

1. **Add Missing Locations**: Report accessible facilities
2. **Verify Existing Data**: Confirm accuracy of listed facilities
3. **Add Photos**: Upload photos of accessibility features
4. **Update Information**: Report changes to existing facilities

## Development Setup

### Prerequisites

- **Node.js**: 18+ or **Python**: 3.9+
- **PostgreSQL**: 14+ with PostGIS extension
- **Redis**: 6+
- **Git**: For version control
- API keys (see API_INTEGRATION.md)

### Setup Steps

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then:
   git clone https://github.com/YOUR_USERNAME/access-Unlocked.git
   cd access-Unlocked
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/Lochy2000/access-Unlocked.git
   ```

3. **Install dependencies**
   ```bash
   # For Node.js
   npm install
   
   # For Python
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

4. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize database**
   ```bash
   # For Node.js
   npm run db:setup
   
   # For Python
   python manage.py migrate
   python manage.py loaddata fixtures/initial_data.json
   ```

6. **Run tests**
   ```bash
   npm test
   # or
   pytest
   ```

7. **Start development server**
   ```bash
   npm run dev
   # or
   python manage.py runserver
   ```

### Development Tools

Recommended tools:
- **IDE**: VS Code, WebStorm, PyCharm
- **Extensions**: ESLint, Prettier, GitLens
- **Database**: pgAdmin, DBeaver
- **API Testing**: Postman, Insomnia
- **Git GUI**: GitHub Desktop, GitKraken (optional)

## Coding Standards

### General Principles

1. **Readability**: Code should be self-documenting
2. **Simplicity**: Prefer simple solutions over clever ones
3. **Consistency**: Follow existing patterns
4. **Performance**: Consider performance implications
5. **Accessibility**: Always consider accessibility impact

### Style Guides

#### JavaScript/TypeScript

Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

**Key points:**
- Use `const` by default, `let` when reassignment needed
- Use arrow functions for callbacks
- Use template literals for string interpolation
- Use destructuring where appropriate
- Prefer async/await over promises

```javascript
// Good
const fetchAccessiblePlaces = async (location, radius = 1000) => {
  const { lat, lng } = location;
  const results = await db.query(
    'SELECT * FROM facilities WHERE ST_DWithin(location, ST_MakePoint($1, $2)::geography, $3)',
    [lng, lat, radius]
  );
  return results.rows;
};

// Bad
function fetchAccessiblePlaces(location, radius) {
  radius = radius || 1000;
  var lat = location.lat;
  var lng = location.lng;
  return db.query('SELECT * FROM facilities WHERE ...').then(function(results) {
    return results.rows;
  });
}
```

#### Python

Follow [PEP 8](https://pep8.org/)

**Key points:**
- Use 4 spaces for indentation
- Maximum line length: 88 characters (Black formatter)
- Use type hints
- Use docstrings for functions and classes

```python
# Good
from typing import List, Tuple
from dataclasses import dataclass

@dataclass
class Location:
    lat: float
    lng: float

async def fetch_accessible_places(
    location: Location, 
    radius: int = 1000
) -> List[dict]:
    """
    Fetch accessible places within a given radius.
    
    Args:
        location: The center point for the search
        radius: Search radius in meters (default: 1000)
        
    Returns:
        List of accessible places
    """
    query = """
        SELECT * FROM facilities 
        WHERE ST_DWithin(location, ST_MakePoint(%s, %s)::geography, %s)
    """
    results = await db.fetch(query, location.lng, location.lat, radius)
    return results
```

#### CSS/Sass

- Use BEM naming convention
- Mobile-first approach
- Use CSS variables for theming
- Ensure high contrast ratios (WCAG AA minimum)

```css
/* Good */
.facility-card {
  padding: var(--spacing-md);
  background: var(--color-background);
  border-radius: var(--border-radius);
}

.facility-card__title {
  font-size: var(--font-size-lg);
  color: var(--color-text-primary);
}

.facility-card--accessible {
  border-left: 4px solid var(--color-success);
}
```

### Naming Conventions

- **Variables**: camelCase (JS) or snake_case (Python)
- **Functions**: camelCase (JS) or snake_case (Python)
- **Classes**: PascalCase
- **Constants**: UPPER_SNAKE_CASE
- **Files**: kebab-case.js or snake_case.py
- **Components**: PascalCase.jsx

### Comments

- Write self-documenting code first
- Add comments for complex logic
- Keep comments up-to-date
- Use JSDoc/docstrings for functions

```javascript
/**
 * Calculate the accessible route between two points, avoiding stairs
 * and steep inclines when possible.
 * 
 * @param {Location} start - Starting location
 * @param {Location} end - Destination location
 * @param {Object} options - Routing options
 * @param {boolean} options.avoidStairs - Avoid stairs (default: true)
 * @param {number} options.maxIncline - Maximum incline in degrees (default: 5)
 * @returns {Promise<Route>} The calculated route
 */
async function calculateAccessibleRoute(start, end, options = {}) {
  const { avoidStairs = true, maxIncline = 5 } = options;
  // Implementation...
}
```

## Pull Request Process

### Before Submitting

1. **Update from upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

3. **Make your changes**
   - Write clean, documented code
   - Follow coding standards
   - Add tests for new functionality
   - Update documentation

4. **Test your changes**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add wheelchair accessible route planning"
   ```

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(search): add radius filter to location search

Allow users to specify custom search radius from 500m to 5km.
Defaults to 1km if not specified.

Closes #123
```

```
fix(api): handle null response from Wheelmap API

Added error handling for cases where Wheelmap API returns null
instead of empty array, preventing app crashes.

Fixes #456
```

### Submitting Pull Request

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request on GitHub**
   - Use a descriptive title
   - Fill out the PR template
   - Link related issues
   - Add screenshots for UI changes
   - Request review from maintainers

3. **PR Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update
   
   ## Changes Made
   - Added X functionality
   - Fixed Y bug
   - Updated Z documentation
   
   ## Testing
   - [ ] Unit tests pass
   - [ ] Integration tests pass
   - [ ] Manual testing completed
   
   ## Screenshots (if applicable)
   [Add screenshots here]
   
   ## Related Issues
   Closes #123
   Related to #456
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] Tests added/updated
   - [ ] No new warnings
   ```

4. **Address Review Comments**
   - Respond to all comments
   - Make requested changes
   - Push updates to the same branch

## Testing Guidelines

### Test Coverage

Aim for:
- **Unit tests**: 80%+ coverage
- **Integration tests**: Critical paths
- **E2E tests**: Core user flows

### Writing Tests

#### Unit Tests

```javascript
// Example: Jest test
describe('AccessibilityService', () => {
  describe('findNearbyFacilities', () => {
    it('should return facilities within specified radius', async () => {
      const location = { lat: 52.5200, lng: 13.4050 };
      const radius = 1000;
      
      const facilities = await AccessibilityService.findNearbyFacilities(
        location,
        radius
      );
      
      expect(facilities).toBeDefined();
      expect(facilities.length).toBeGreaterThan(0);
      
      facilities.forEach(facility => {
        const distance = calculateDistance(location, facility.location);
        expect(distance).toBeLessThanOrEqual(radius);
      });
    });
    
    it('should handle empty results gracefully', async () => {
      const location = { lat: 0, lng: 0 }; // Middle of ocean
      const facilities = await AccessibilityService.findNearbyFacilities(
        location,
        1000
      );
      
      expect(facilities).toEqual([]);
    });
  });
});
```

#### Integration Tests

```javascript
// Example: API integration test
describe('Wheelmap API Integration', () => {
  it('should fetch accessible places from Wheelmap', async () => {
    const response = await wheelmapService.getAccessiblePlaces(
      52.5200,
      13.4050,
      1000
    );
    
    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data.nodes)).toBe(true);
  });
});
```

#### E2E Tests

```javascript
// Example: Playwright E2E test
test('user can search for accessible toilets', async ({ page }) => {
  await page.goto('/');
  
  // Allow location access
  await page.context().grantPermissions(['geolocation']);
  
  // Search for accessible toilets
  await page.fill('[data-testid="search-input"]', 'accessible toilet');
  await page.click('[data-testid="search-button"]');
  
  // Verify results appear
  await expect(page.locator('[data-testid="facility-card"]').first())
    .toBeVisible();
  
  // Click on first result
  await page.click('[data-testid="facility-card"]');
  
  // Verify details page
  await expect(page.locator('[data-testid="facility-details"]'))
    .toBeVisible();
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- search.test.js

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run E2E tests
npm run test:e2e
```

## Documentation

### Code Documentation

- Use JSDoc for JavaScript
- Use docstrings for Python
- Document complex algorithms
- Keep comments up-to-date

### User Documentation

- Update README.md if needed
- Add to docs/ folder for detailed guides
- Include examples and screenshots
- Keep language simple and clear

### API Documentation

- Document all endpoints
- Include request/response examples
- Document error codes
- Update OpenAPI/Swagger specs

## Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat (coming soon)
- **Email**: dev@access-unlocked.org

### Getting Help

- Check existing documentation
- Search closed issues
- Ask in GitHub Discussions
- Reach out to maintainers

### Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Annual contributor spotlight

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to ask! We're here to help:
- Create an issue with the `question` label
- Post in GitHub Discussions
- Email: dev@access-unlocked.org

---

Thank you for contributing to making the world more accessible! 🙏
