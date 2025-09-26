"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { School } from '@/types';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Users, BookOpen } from 'lucide-react';

interface SchoolsForDistributionsProps {
  onSelectSchool: (school: School) => void;
  selectedSchoolId?: number;
  localCouncilId?: number;
  disabled?: boolean;
}

export function SchoolsForDistributions({
  onSelectSchool,
  selectedSchoolId,
  localCouncilId,
  disabled = false
}: SchoolsForDistributionsProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchSchools();
  }, [localCouncilId]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (localCouncilId) {
        params.append('localCouncilId', localCouncilId.toString());
      }

      params.append('isActive', 'true');
      params.append('limit', '100');

      const response = await fetch(`/api/schools?${params}`);
      const data = await response.json();

      if (data.success) {
        setSchools(data.data.schools || []);
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.emisCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.district?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-8 w-8" />
        <span className="ml-2">Loading schools...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search schools by name, EMIS code, or district..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          disabled={disabled}
        />
      </div>

      {filteredSchools.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {searchTerm ? 'No schools found matching your search.' : 'No schools available.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 max-h-96 overflow-y-auto">
          {filteredSchools.map((school) => (
            <Card
              key={school.id}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                selectedSchoolId === school.id ? 'ring-2 ring-primary bg-accent' : ''
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !disabled && onSelectSchool(school)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{school.name}</h4>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      {school.emisCode && (
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {school.emisCode}
                        </span>
                      )}
                      {school.district && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {school.district}
                        </span>
                      )}
                      {school.totalStudents && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {school.totalStudents} students
                        </span>
                      )}
                    </div>
                    {school.location && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {school.location}
                      </p>
                    )}
                  </div>
                  {selectedSchoolId === school.id && (
                    <div className="ml-2">
                      <div className="h-2 w-2 bg-primary rounded-full"></div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}