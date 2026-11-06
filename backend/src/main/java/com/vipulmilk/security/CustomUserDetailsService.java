package com.vipulmilk.security;

import com.vipulmilk.entity.Owner;
import com.vipulmilk.repository.OwnerRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final OwnerRepository ownerRepository;

    public CustomUserDetailsService(OwnerRepository ownerRepository) {
        this.ownerRepository = ownerRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Owner owner = ownerRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Owner with username " + username + " not found"));

        return new User(
                owner.getUsername(),
                owner.getPasswordHash(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_OWNER"))
        );
    }
}

