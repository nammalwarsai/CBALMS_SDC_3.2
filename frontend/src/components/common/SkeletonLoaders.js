import React from 'react';
import { Card, Placeholder } from 'react-bootstrap';

/**
 * Skeleton loader for stat cards
 */
export const StatCardSkeleton = () => (
  <Card className="stat-card text-center">
    <Card.Body>
      <Placeholder as="h3" animation="glow">
        <Placeholder xs={4} />
      </Placeholder>
      <Placeholder as="p" animation="glow">
        <Placeholder xs={6} />
      </Placeholder>
    </Card.Body>
  </Card>
);

/**
 * Skeleton loader for table rows
 */
export const TableRowSkeleton = ({ columns = 5, rows = 5 }) => (
  <>
    {[...Array(rows)].map((_, i) => (
      <tr key={i}>
        {[...Array(columns)].map((_, j) => (
          <td key={j}>
            <Placeholder animation="glow">
              <Placeholder xs={Math.floor(Math.random() * 4) + 4} />
            </Placeholder>
          </td>
        ))}
      </tr>
    ))}
  </>
);

/**
 * Skeleton loader for content cards
 */
export const ContentCardSkeleton = () => (
  <Card className="content-card">
    <Card.Header>
      <Placeholder animation="glow">
        <Placeholder xs={4} />
      </Placeholder>
    </Card.Header>
    <Card.Body>
      <Placeholder animation="glow">
        <Placeholder xs={12} className="mb-2" />
        <Placeholder xs={10} className="mb-2" />
        <Placeholder xs={8} className="mb-2" />
        <Placeholder xs={11} className="mb-2" />
        <Placeholder xs={6} />
      </Placeholder>
    </Card.Body>
  </Card>
);

/**
 * Skeleton loader for profile
 */
export const ProfileSkeleton = () => (
  <Card className="content-card">
    <Card.Body className="text-center">
      <Placeholder animation="glow">
        <Placeholder xs={3} className="rounded-circle mb-3" style={{ width: 100, height: 100 }} />
      </Placeholder>
      <Placeholder as="h4" animation="glow">
        <Placeholder xs={6} />
      </Placeholder>
      <Placeholder animation="glow">
        <Placeholder xs={4} />
      </Placeholder>
    </Card.Body>
  </Card>
);
